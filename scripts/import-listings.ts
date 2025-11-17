/* eslint-disable no-console */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import { prisma } from "../lib/prisma";
import { generateUniqueSlug, generateSlug } from "../lib/slug";

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
    // CDATA wird als __cdata gespeichert
    if (typeof (val as any).__cdata === "string") return (val as any).__cdata;
    if (typeof (val as any)["#text"] === "string") return (val as any)["#text"];
  }
  return undefined;
}

function parseDate(d: string | undefined): Date | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : dt;
}

function parseIntSafe(val: string | undefined): number | undefined {
  if (!val) return undefined;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? undefined : parsed;
}

// PHP-serialisiertes Array parsen (einfache Version)
function parsePhpArray(serialized: string | undefined): any {
  if (!serialized || !serialized.startsWith("a:")) return null;
  try {
    // Einfacher Parser für einfache Arrays
    // Format: a:N:{key1;value1;key2;value2;...}
    const match = serialized.match(/^a:(\d+):\{/);
    if (!match) return null;
    
    // Für unsere Zwecke extrahieren wir nur die Werte
    const result: any = {};
    const content = serialized.slice(match[0].length, -1);
    
    // Einfache Extraktion für address, lat, lng
    const addressMatch = content.match(/s:\d+:"address";s:\d+:"([^"]+)"/);
    if (addressMatch) result.address = addressMatch[1];
    
    const latMatch = content.match(/s:\d+:"lat";s:\d+:"([^"]+)"/);
    if (latMatch) result.lat = latMatch[1];
    
    const lngMatch = content.match(/s:\d+:"lng";s:\d+:"([^"]+)"/);
    if (lngMatch) result.lng = lngMatch[1];
    
    return result;
  } catch {
    return null;
  }
}

// PHP-serialisiertes Array von IDs parsen
function parsePhpIdArray(serialized: string | undefined): string[] {
  if (!serialized || !serialized.startsWith("a:")) return [];
  try {
    const ids: string[] = [];
    const matches = serialized.matchAll(/i:\d+;s:\d+:"(\d+)"/g);
    for (const match of matches) {
      ids.push(match[1]);
    }
    return ids;
  } catch {
    return [];
  }
}

// Extrahiere Features aus Kategorien
function extractFeatures(item: WPItem): string[] {
  const features: string[] = [];
  const cats = toArray(item["category"]);
  
  const featureDomains = [
    "waschen",
    "draussen",
    "aufbau",
    "techn--features",
    "kochen",
    "innenausstattung",
    "camper-regeln",
  ];
  
  for (const c of cats) {
    const domain = coerceString(c?.["@_domain"])?.toLowerCase();
    const text = coerceString(c) ?? coerceString(c?.["#text"]) ?? coerceString(c?.["@_nicename"]);
    if (!text) continue;
    
    if (featureDomains.includes(domain || "")) {
      // Normalisiere Feature-Namen
      const normalized = text
        .replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "")
        .trim();
      if (normalized && !features.includes(normalized)) {
        features.push(normalized);
      }
    }
  }
  
  return features;
}

// Extrahiere Standort aus Kategorien oder Metadaten
function extractLocation(item: WPItem, metas: any[]): string {
  // Versuche zuerst aus Metadaten
  const locationMeta = metas.find(
    (m) => coerceString(m?.["wp:meta_key"]) === "estate_location"
  );
  if (locationMeta) {
    const locationValue = coerceString(locationMeta?.["wp:meta_value"]);
    if (locationValue) {
      const parsed = parsePhpArray(locationValue);
      if (parsed?.address) {
        // Extrahiere nur Stadt/PLZ aus Adresse
        const parts = parsed.address.split(",");
        if (parts.length >= 2) {
          return parts[parts.length - 2].trim();
        }
        return parsed.address;
      }
    }
  }
  
  // Fallback: Aus Kategorien
  const cats = toArray(item["category"]);
  const stadt = cats.find(
    (c) => coerceString(c?.["@_domain"]) === "stadt"
  );
  if (stadt) {
    const text = coerceString(stadt) ?? coerceString(stadt?.["#text"]);
    if (text) {
      // Entferne "Wohnmobil in ... mieten"
      return text.replace(/Wohnmobil in (.+) mieten/i, "$1").trim();
    }
  }
  
  const landkreis = cats.find(
    (c) => coerceString(c?.["@_domain"]) === "landkreis"
  );
  if (landkreis) {
    return coerceString(landkreis) ?? coerceString(landkreis?.["#text"]) ?? "";
  }
  
  return "Unbekannt";
}

async function ensureDefaultUser() {
  // Prüfe ob ein Standard-User existiert, sonst erstelle einen
  let defaultUser = await prisma.user.findFirst({
    where: { email: "import@womosuche.de" },
  });
  
  if (!defaultUser) {
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.default.hash("import-temp-password", 10);
    defaultUser = await prisma.user.create({
      data: {
        email: "import@womosuche.de",
        name: "Import User",
        password: hashedPassword,
        role: "LANDLORD",
      },
    });
    console.log("Standard-User für Import erstellt:", defaultUser.email);
  }
  
  return defaultUser.id;
}

async function importListings(filePath: string) {
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

  // Attachment-Map: wp:post_id -> URL
  const attachmentUrlById = new Map<string, string>();
  for (const item of items) {
    const postType = coerceString(item?.["wp:post_type"]);
    if (postType === "attachment") {
      const id = coerceString(item?.["wp:post_id"]);
      const attachmentUrl =
        coerceString(item?.["wp:attachment_url"]) ??
        coerceString(item?.guid) ??
        coerceString(item?.link);
      if (id && attachmentUrl) {
        attachmentUrlById.set(id, attachmentUrl);
      }
    }
  }

  const defaultOwnerId = await ensureDefaultUser();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  console.log(`Gesamt Items gefunden: ${items.length}`);
  
  for (const item of items) {
    try {
      const postType = coerceString(item?.["wp:post_type"]);
      
      if (postType !== "estate") {
        skipped++;
        continue;
      }

      const status = coerceString(item?.["wp:status"]) ?? "draft";
      const isPublished = status === "publish" || status === "pending";

      const title = coerceString(item?.title) ?? "(Ohne Titel)";
      const wpSlug = coerceString(item?.["wp:post_name"]);
      
      // Content als Beschreibung
      const rawContent = item?.["content:encoded"];
      const description =
        coerceString(rawContent?.__cdata) ??
        coerceString(rawContent) ??
        coerceString(item?.description) ??
        "";

      // Metadaten extrahieren
      const metas = toArray(item?.["wp:postmeta"]);
      
      // Preis
      const priceFromMeta = metas.find(
        (m) => coerceString(m?.["wp:meta_key"]) === "estate_attr_price_from"
      );
      const priceFrom = parseIntSafe(coerceString(priceFromMeta?.["wp:meta_value"])) ?? 0;
      
      // Sitzplätze und Betten aus Kategorien
      const cats = toArray(item["category"]);
      const sitzplaetzeCat = cats.find(
        (c) => coerceString(c?.["@_domain"]) === "sitzplaetze"
      );
      const seats = parseIntSafe(
        coerceString(sitzplaetzeCat) ?? coerceString(sitzplaetzeCat?.["#text"])
      ) ?? 2;
      
      const schlafplaetzeCat = cats.find(
        (c) => coerceString(c?.["@_domain"]) === "schlafplaetze"
      );
      const beds = parseIntSafe(
        coerceString(schlafplaetzeCat) ?? coerceString(schlafplaetzeCat?.["#text"])
      ) ?? 2;

      // Standort
      const location = extractLocation(item, metas);

      // Features
      const features = extractFeatures(item);

      // Bilder aus Gallery
      const galleryMeta = metas.find(
        (m) => coerceString(m?.["wp:meta_key"]) === "estate_gallery"
      );
      const galleryValue = coerceString(galleryMeta?.["wp:meta_value"]);
      const galleryIds = parsePhpIdArray(galleryValue);
      const imageUrls: string[] = [];
      
      // Debug: Log Gallery-IDs
      if (galleryIds.length > 0) {
        console.log(`Listing ${title}: ${galleryIds.length} Gallery-IDs gefunden`);
      }
      
      for (const id of galleryIds.slice(0, 10)) {
        // Maximal 10 Bilder
        const url = attachmentUrlById.get(id);
        if (url) {
          imageUrls.push(url);
        } else {
          console.warn(`Listing ${title}: Bild-ID ${id} nicht in attachmentUrlById gefunden`);
        }
      }

      // Featured Image
      const thumbMeta = metas.find(
        (m) => coerceString(m?.["wp:meta_key"]) === "_thumbnail_id"
      );
      const thumbId = coerceString(thumbMeta?.["wp:meta_value"]);
      if (thumbId && attachmentUrlById.has(thumbId)) {
        const thumbUrl = attachmentUrlById.get(thumbId);
        if (thumbUrl && !imageUrls.includes(thumbUrl)) {
          imageUrls.unshift(thumbUrl); // Als erstes Bild
        }
      } else if (thumbId) {
        console.warn(`Listing ${title}: Featured Image ID ${thumbId} nicht in attachmentUrlById gefunden`);
      }

      // Fallback: Versuche Bilder aus dem Content zu extrahieren
      if (imageUrls.length === 0 && description) {
        const imageMatches = description.matchAll(/https?:\/\/[^\s"<>]+\.(jpg|jpeg|png|webp|gif)/gi);
        const contentImageUrls: string[] = [];
        for (const match of imageMatches) {
          const url = match[0];
          if (url && !contentImageUrls.includes(url)) {
            contentImageUrls.push(url);
          }
        }
        if (contentImageUrls.length > 0) {
          console.log(`Listing ${title}: ${contentImageUrls.length} Bilder aus Content extrahiert`);
          imageUrls.push(...contentImageUrls.slice(0, 10));
        }
      }

      // Debug: Log finale Bild-URLs
      if (imageUrls.length > 0) {
        console.log(`Listing ${title}: ${imageUrls.length} Bilder werden gespeichert`);
      } else {
        console.warn(`Listing ${title}: KEINE BILDER gefunden!`);
      }

      // Slug generieren
      const baseSlug = wpSlug && wpSlug.trim().length > 1 ? wpSlug : generateSlug(title);
      const slug = await generateUniqueSlug(baseSlug, async (s) => {
        const existing = await prisma.listing.findUnique({ where: { slug: s } });
        return !existing;
      });

      // Prüfe ob bereits vorhanden
      const existing = await prisma.listing.findUnique({ where: { slug } });
      
      const listingData = {
        title,
        slug,
        description: description.substring(0, 10000), // Limit für DB
        pricePerDay: priceFrom,
        seats,
        beds,
        location,
        features,
        published: isPublished,
        ownerId: defaultOwnerId,
      };

      if (existing) {
        await prisma.listing.update({
          where: { slug },
          data: listingData,
        });
        
        // Bilder aktualisieren
        if (imageUrls.length > 0) {
          // Lösche alte Bilder
          await prisma.image.deleteMany({
            where: { listingId: existing.id },
          });
          
          // Erstelle neue Bilder
          await prisma.image.createMany({
            data: imageUrls.map((url) => ({
              listingId: existing.id,
              url,
              alt: title,
            })),
          });
        }
        
        updated++;
      } else {
        const newListing = await prisma.listing.create({
          data: listingData,
        });
        
        // Bilder hinzufügen
        if (imageUrls.length > 0) {
          await prisma.image.createMany({
            data: imageUrls.map((url) => ({
              listingId: newListing.id,
              url,
              alt: title,
            })),
          });
        }
        
        created++;
      }
    } catch (error) {
      console.error(`Fehler beim Import von Item:`, error);
      errors++;
    }
  }

  console.log(`\nImport abgeschlossen:`);
  console.log(`  Erstellt: ${created}`);
  console.log(`  Aktualisiert: ${updated}`);
  console.log(`  Übersprungen: ${skipped}`);
  console.log(`  Fehler: ${errors}`);
}

async function main() {
  try {
    const xmlFile = path.join(process.cwd(), "public", "wohnmobile-export.xml");
    console.log("Lese Datei:", xmlFile);
    await importListings(xmlFile);
  } catch (err) {
    console.error("Fehler beim Import:", err);
    process.exitCode = 1;
  } finally {
    if (prisma && typeof (prisma as any).$disconnect === "function") {
      await (prisma as any).$disconnect();
    }
  }
}

void main();

