import { readFile, writeFile } from "fs/promises";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../lib/prisma";
import { parse } from "csv-parse/sync";

type WPItem = Record<string, any>;

function toArray<T>(val: T | T[] | undefined | null): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function coerceString(val: any): string | undefined {
  if (val == null) return undefined;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (typeof (val as any).__cdata === "string") return (val as any).__cdata;
    if (typeof (val as any)["#text"] === "string") return (val as any)["#text"];
  }
  return undefined;
}

function normalizeEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  return email.trim().toLowerCase();
}

function normalizeLogin(login: string | undefined | null): string | null {
  if (!login) return null;
  return login.trim().toLowerCase().replace(/\s+/g, "-");
}

interface AuthorMapping {
  authorId: string;
  email: string | null;
  login: string | null;
  displayName: string | null;
}

interface ListingInfo {
  slug: string;
  title: string;
  authorEmail: string | null;
  authorLogin: string | null;
  authorId: string | null;
}

interface UnmatchedListing {
  slug: string;
  title: string;
  authorEmail: string | null;
  authorLogin: string | null;
  authorId: string | null;
  wpAuthorDisplayName: string | null;
}

async function extractAuthorsFromXML(filePath: string): Promise<Map<string, AuthorMapping>> {
  const xml = await readFile(filePath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    preserveOrder: false,
    trimValues: false,
  });

  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  const authors = toArray(channel?.["wp:author"]);

  const authorMap = new Map<string, AuthorMapping>();

  for (const author of authors) {
    const authorId = coerceString(author?.["wp:author_id"]);
    const email = normalizeEmail(coerceString(author?.["wp:author_email"]));
    const login = normalizeLogin(coerceString(author?.["wp:author_login"]));
    const displayName = coerceString(author?.["wp:author_display_name"]);

    if (authorId) {
      authorMap.set(authorId, {
        authorId,
        email,
        login,
        displayName,
      });
    }
  }

  console.log(`📚 ${authorMap.size} Autoren aus XML extrahiert`);
  return authorMap;
}

async function extractListingsFromXML(filePath: string, authorMap: Map<string, AuthorMapping>): Promise<ListingInfo[]> {
  const xml = await readFile(filePath, "utf8");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    preserveOrder: false,
    trimValues: false,
  });

  const doc = parser.parse(xml);
  const channel = doc?.rss?.channel;
  const items: WPItem[] = toArray(channel?.item);

  const listings: ListingInfo[] = [];

  for (const item of items) {
    const postType = coerceString(item?.["wp:post_type"]);
    if (postType !== "estate") continue;

    const title = coerceString(item?.title) ?? "";
    const wpSlug = coerceString(item?.["wp:post_name"]);
    
    // Versuche Author-Info zu finden
    const creator = coerceString(item?.["dc:creator"]); // Display-Name
    const postAuthor = coerceString(item?.["wp:post_author"]); // Author-ID
    
    let authorEmail: string | null = null;
    let authorLogin: string | null = null;
    let authorId: string | null = null;

    // Strategie 1: Verwende wp:post_author (ID) falls vorhanden
    if (postAuthor && authorMap.has(postAuthor)) {
      const author = authorMap.get(postAuthor)!;
      authorEmail = author.email;
      authorLogin = author.login;
      authorId = postAuthor;
    }
    // Strategie 2: Suche nach Display-Name in Author-Map
    else if (creator) {
      for (const [id, author] of authorMap.entries()) {
        if (author.displayName === creator || author.login === creator) {
          authorEmail = author.email;
          authorLogin = author.login;
          authorId = id;
          break;
        }
      }
    }

    // Fallback: Suche in Metadaten
    if (!authorEmail) {
      const metas = toArray(item?.["wp:postmeta"]);
      const authorMeta = metas.find(
        (m) => coerceString(m?.["wp:meta_key"]) === "estate_agent" ||
               coerceString(m?.["wp:meta_key"]) === "author_email"
      );
      if (authorMeta) {
        const metaValue = coerceString(authorMeta?.["wp:meta_value"]);
        if (metaValue && metaValue.includes("@")) {
          authorEmail = normalizeEmail(metaValue);
        }
      }
    }

    if (wpSlug) {
      listings.push({
        slug: wpSlug,
        title,
        authorEmail,
        authorLogin,
        authorId,
      });
    }
  }

  console.log(`📋 ${listings.length} Listings aus XML extrahiert`);
  return listings;
}

async function mapListingsToUsers() {
  try {
    const xmlFile = path.join(process.cwd(), "public", "wohnmobile-export.xml");
    console.log(`📂 Lese XML-Datei: ${xmlFile}\n`);

    // Extrahiere Author-Map einmal
    const authorMap = await extractAuthorsFromXML(xmlFile);

    // Extrahiere Listing-Informationen aus XML (mit Author-Map)
    const listings = await extractListingsFromXML(xmlFile, authorMap);

    // Lade alle User aus der Datenbank
    const users = await prisma.user.findMany({
      where: { role: "LANDLORD" },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`👥 ${users.length} LANDLORD-User in Datenbank gefunden\n`);

    // Erstelle Mapping-Maps für schnelle Suche
    const userByEmail = new Map<string, typeof users[0]>();
    const userByLogin = new Map<string, typeof users[0]>();

    for (const user of users) {
      const normalizedEmail = normalizeEmail(user.email);
      if (normalizedEmail) {
        userByEmail.set(normalizedEmail, user);
      }

      // Versuche Login aus E-Mail zu extrahieren (vor @)
      const emailPrefix = user.email.split("@")[0].toLowerCase();
      userByLogin.set(emailPrefix, user);

      // Versuche auch aus Name zu extrahieren
      if (user.name) {
        const normalizedName = normalizeLogin(user.name);
        if (normalizedName) {
          userByLogin.set(normalizedName, user);
        }
      }
    }

    let matched = 0;
    let updated = 0;
    let unmatched: UnmatchedListing[] = [];

    console.log("🔄 Starte Mapping-Prozess...\n");

    for (const listing of listings) {
      try {
        // Versuche Listing in DB zu finden
        const dbListing = await prisma.listing.findUnique({
          where: { slug: listing.slug },
          select: { id: true, ownerId: true },
        });

        if (!dbListing) {
          console.log(`⏭️  Listing nicht gefunden (übersprungen): ${listing.slug}`);
          continue;
        }

        let matchedUser: typeof users[0] | null = null;

        // Strategie 1: E-Mail-Matching
        if (listing.authorEmail) {
          matchedUser = userByEmail.get(listing.authorEmail) || null;
          if (matchedUser) {
            console.log(`✅ E-Mail-Match: ${listing.slug} → ${matchedUser.email}`);
          }
        }

        // Strategie 2: Login-Matching (Fallback)
        if (!matchedUser && listing.authorLogin) {
          matchedUser = userByLogin.get(listing.authorLogin) || null;
          if (matchedUser) {
            console.log(`✅ Login-Match: ${listing.slug} → ${matchedUser.email}`);
          }
        }

        if (matchedUser) {
          matched++;
          
          // Update nur wenn ownerId unterschiedlich
          if (dbListing.ownerId !== matchedUser.id) {
            await prisma.listing.update({
              where: { id: dbListing.id },
              data: { ownerId: matchedUser.id },
            });
            updated++;
          }
        } else {
          // Kein Match gefunden - zu Unmatched hinzufügen
          const author = listing.authorId ? authorMap.get(listing.authorId) : null;
          
          unmatched.push({
            slug: listing.slug,
            title: listing.title,
            authorEmail: listing.authorEmail,
            authorLogin: listing.authorLogin,
            authorId: listing.authorId,
            wpAuthorDisplayName: author?.displayName || null,
          });
        }
      } catch (error) {
        console.error(`❌ Fehler beim Mapping von ${listing.slug}:`, error);
      }
    }

    // Exportiere unmatched Listings
    if (unmatched.length > 0) {
      const csvHeader = "slug,title,authorEmail,authorLogin,authorId,wpAuthorDisplayName\n";
      const csvRows = unmatched.map((u) => {
        return [
          u.slug,
          `"${u.title.replace(/"/g, '""')}"`,
          u.authorEmail || "",
          u.authorLogin || "",
          u.authorId || "",
          u.wpAuthorDisplayName || "",
        ].join(",");
      });
      
      const csvContent = csvHeader + csvRows.join("\n");
      const unmatchedFile = path.join(process.cwd(), "public", "unmatched-listings.csv");
      await writeFile(unmatchedFile, csvContent, "utf8");
      
      console.log(`\n📄 ${unmatched.length} unmatched Listings nach ${unmatchedFile} exportiert`);
    }

    console.log(`\n📊 Mapping abgeschlossen:`);
    console.log(`  ✅ Matched: ${matched}`);
    console.log(`  🔄 Aktualisiert: ${updated}`);
    console.log(`  ❓ Unmatched: ${unmatched.length}`);
    
    if (unmatched.length > 0) {
      console.log(`\n💡 Nächste Schritte:`);
      console.log(`  1. Öffne public/unmatched-listings.csv`);
      console.log(`  2. Füge eine Spalte "user_email" hinzu und trage die E-Mail des passenden Users ein`);
      console.log(`  3. Führe dann: npm run map:listings:manual`);
    }
  } catch (error) {
    console.error("❌ Fehler:", error);
    throw error;
  }
}

async function main() {
  try {
    await mapListingsToUsers();
  } catch (error) {
    console.error("❌ Fehler:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

