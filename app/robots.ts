import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/api/"],
    },
    sitemap: `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/sitemap.xml`,
  };
}

