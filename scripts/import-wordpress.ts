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
    // fast-xml-parser: Textknoten liegen häufig unter "#text"
    if (typeof (val as any)["#text"] === "string") return (val as any)["#text"];
  }
  return undefined;
}

function parseDate(d: string | undefined): Date | undefined {
  if (!d) return undefined;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? undefined : dt;
}

function collectTagsAndCategories(item: WPItem): { tags: string[]; categories: string[] } {
  const cats = toArray(item["category"]);
  const tags: string[] = [];
  const categories: string[] = [];
  for (const c of cats) {
    // Kategorien/Tags haben Attribute in fast-xml-parser über "@_"
    const domain = coerceString(c?.["@_domain"])?.toLowerCase();
    const text = coerceString(c) ?? coerceString(c?.["#text"]) ?? coerceString(c?.["@_nicename"]);
    if (!text) continue;
    if (domain === "post_tag") {
      if (!tags.includes(text)) tags.push(text);
    } else if (domain === "category") {
      if (!categories.includes(text)) categories.push(text);
    }
  }
  return { tags, categories };
}

async function ensureUniqueSlug(preferredSlug: string | undefined, title: string): Promise<string> {
  const base = preferredSlug && preferredSlug.trim().length > 1 ? preferredSlug : generateSlug(title);
  const unique = await generateUniqueSlug(base, async (slug) => {
    const existing = await prisma.article.findUnique({ where: { slug } });
    return !existing;
  });
  return unique;
}

async function importWordPressXML(filePath: string) {
  const xml = await readFile(filePath, "utf8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    // CDATA (z. B. content:encoded) korrekt übernehmen
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

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const postType = coerceString(item?.["wp:post_type"]);
    if (postType !== "post") {
      skipped++;
      continue;
    }

    const status = coerceString(item?.["wp:status"]) ?? "draft";
    const isPublished = status === "publish";

    const title = coerceString(item?.title) ?? "(Ohne Titel)";
    const wpSlug = coerceString(item?.["wp:post_name"]);

    // content:encoded und excerpt:encoded enthalten häufig CDATA
    const rawContent = item?.["content:encoded"];
    const content =
      coerceString(rawContent?.__cdata) ??
      coerceString(rawContent) ??
      coerceString(item?.description) ??
      "";

    const rawExcerpt = item?.["excerpt:encoded"];
    const excerpt =
      coerceString(rawExcerpt?.__cdata) ??
      coerceString(rawExcerpt) ??
      undefined;

    const createdAt =
      parseDate(coerceString(item?.["wp:post_date"])) ??
      parseDate(coerceString(item?.pubDate)) ??
      undefined;

    const { tags, categories } = collectTagsAndCategories(item);

    // Featured Image ermitteln: _thumbnail_id -> attachment URL
    let featuredImageUrl: string | undefined;
    const metas = toArray(item?.["wp:postmeta"]);
    const thumbMeta = metas.find((m) => coerceString(m?.["wp:meta_key"]) === "_thumbnail_id");
    const thumbId = coerceString(thumbMeta?.["wp:meta_value"]);
    if (thumbId && attachmentUrlById.has(thumbId)) {
      featuredImageUrl = attachmentUrlById.get(thumbId);
    }

    const slug = await ensureUniqueSlug(wpSlug, title);
    // Legacy URL (Pfad) für Redirects speichern
    const legacyFull = coerceString(item?.link);
    let legacyPath: string | undefined;
    try {
      if (legacyFull) {
        const u = new URL(legacyFull);
        legacyPath = u.pathname.endsWith("/") ? u.pathname.slice(0, -1) : u.pathname;
        if (!legacyPath) legacyPath = "/";
      }
    } catch {
      // kein valider URL-String
      legacyPath = undefined;
    }

    // Upsert anhand des Slugs (unique)
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) {
      await prisma.article.update({
        where: { slug },
        data: {
          title,
          excerpt,
          content,
          tags,
          categories,
          featuredImageUrl,
          legacyUrl: legacyPath,
          published: isPublished,
        },
      });
      // Redirect anlegen/aktualisieren
      if (legacyPath) {
        await prisma.redirect.upsert({
          where: { fromPath: legacyPath },
          update: { toPath: `/magazin/${slug}` },
          create: { fromPath: legacyPath, toPath: `/magazin/${slug}` },
        });
      }
      updated++;
      continue;
    }

    await prisma.article.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        tags,
        categories,
        featuredImageUrl,
        legacyUrl: legacyPath,
        published: isPublished,
        ...(createdAt ? { createdAt } : {}),
      },
    });
    if (legacyPath) {
      await prisma.redirect.upsert({
        where: { fromPath: legacyPath },
        update: { toPath: `/magazin/${slug}` },
        create: { fromPath: legacyPath, toPath: `/magazin/${slug}` },
      });
    }
    created++;
  }

  console.log(`Import abgeschlossen. Erstellt: ${created}, Aktualisiert: ${updated}, Übersprungen: ${skipped}`);
}

async function main() {
  try {
    const xmlFile = path.join(process.cwd(), "public", "post_all.xml");
    console.log("Lese Datei:", xmlFile);
    await importWordPressXML(xmlFile);
  } catch (err) {
    console.error("Fehler beim Import:", err);
    process.exitCode = 1;
  } finally {
    // Prisma sauber schließen
    // @ts-ignore
    if (prisma && typeof prisma.$disconnect === "function") {
      await prisma.$disconnect();
    }
  }
}

void main();


