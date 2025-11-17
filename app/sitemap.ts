import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getArticleUrl } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  let listings: Array<{ slug: string; updatedAt: Date }> = [];
  let articles: Array<{ slug: string; updatedAt: Date; categories: string[] | null }> = [];
  let terms: Array<{ slug: string; updatedAt: Date }> = [];

  try {
    [listings, articles, terms] = await Promise.all([
      prisma.listing.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { published: true },
        select: { slug: true, updatedAt: true, categories: true },
      }),
      prisma.glossaryTerm.findMany({
        select: { slug: true, updatedAt: true },
      }),
    ]);
  } catch (error) {
    // Falls DB-Verbindung fehlschlägt, verwende leere Arrays
    // Die statischen Routen werden trotzdem zurückgegeben
    console.error("Sitemap: Fehler beim Laden der Datenbank-Daten:", error);
  }

  const routes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/wohnmobile`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lexikon`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/magazin`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
  ];

  const listingRoutes = listings.map((listing: typeof listings[number]) => ({
    url: `${baseUrl}/wohnmobile/${listing.slug}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articleRoutes = articles.map((article: typeof articles[number]) => ({
    url: `${baseUrl}${getArticleUrl(article.slug, article.categories)}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const termRoutes = terms.map((term: typeof terms[number]) => ({
    url: `${baseUrl}/lexikon/${term.slug}`,
    lastModified: term.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...routes, ...listingRoutes, ...articleRoutes, ...termRoutes];
}

