import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";

  const [listings, articles, terms] = await Promise.all([
    prisma.listing.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.glossaryTerm.findMany({
      select: { slug: true, updatedAt: true },
    }),
  ]);

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

  const listingRoutes = listings.map((listing) => ({
    url: `${baseUrl}/wohnmobile/${listing.slug}`,
    lastModified: listing.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const articleRoutes = articles.map((article) => ({
    url: `${baseUrl}/magazin/${article.slug}`,
    lastModified: article.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const termRoutes = terms.map((term) => ({
    url: `${baseUrl}/lexikon/${term.slug}`,
    lastModified: term.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [...routes, ...listingRoutes, ...articleRoutes, ...termRoutes];
}

