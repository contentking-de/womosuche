import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { generateSlug, getFirstCategorySlug } from "@/lib/slug";
import { ParkingCircle } from "lucide-react";

function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, "&");
}

// Prüft, ob eine Kategorie eine Postleitzahl-Kategorie ist
function isPostalCodeCategory(category: string): boolean {
  const trimmed = category.trim();
  return /^Postleitzahl/i.test(trimmed);
}

type Article = {
  id: string;
  categories: string[] | null;
  slug: string;
  title: string;
  excerpt: string | null;
  featuredImageUrl: string | null;
  createdAt: Date;
  tags: string[];
};

function getArticleUrl(slug: string, categories: string[] | null): string {
  if (categories && categories.length > 0) {
    const postalCodeCategory = categories.find((cat) => isPostalCodeCategory(cat));
    if (postalCodeCategory) {
      const categorySlug = generateSlug(postalCodeCategory);
      return `/magazin/${categorySlug}/${slug}`;
    }
    const firstCategorySlug = getFirstCategorySlug(categories);
    if (firstCategorySlug) {
      return `/magazin/${firstCategorySlug}/${slug}`;
    }
  }
  return `/magazin/${slug}`;
}

export async function generateMetadata() {
  return {
    title: "Wohnmobil Abstellplätze - womosuche.de",
    description: "Finde Abstellplätze für dein Wohnmobil nach Postleitzahl. Übersicht aller verfügbaren Stellplätze in verschiedenen Regionen.",
  };
}

export default async function AbstellplaetzePage() {
  noStore();
  
  // Lade alle veröffentlichten Artikel
  const allArticles: Article[] = await prisma.article.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Filtere Artikel, die mindestens eine Postleitzahl-Kategorie haben
  const articlesWithPostalCodes = allArticles.filter((article) => {
    if (!article.categories || article.categories.length === 0) {
      return false;
    }
    return article.categories.some((cat) => isPostalCodeCategory(cat));
  });

  // Gruppiere Artikel nach Postleitzahl-Kategorien
  const articlesByPostalCode = new Map<string, Article[]>();

  for (const article of articlesWithPostalCodes) {
    if (article.categories) {
      const postalCodeCategories = article.categories.filter((cat) =>
        isPostalCodeCategory(cat)
      );

      for (const postalCodeCategory of postalCodeCategories) {
        if (!articlesByPostalCode.has(postalCodeCategory)) {
          articlesByPostalCode.set(postalCodeCategory, []);
        }
        articlesByPostalCode.get(postalCodeCategory)!.push(article);
      }
    }
  }

  // Sortiere Postleitzahl-Kategorien
  const sortedPostalCodes = Array.from(articlesByPostalCode.keys()).sort((a, b) => {
    // Extrahiere Postleitzahlen für Sortierung
    const zipA = a.match(/\d{5}/)?.[0] || "";
    const zipB = b.match(/\d{5}/)?.[0] || "";
    if (zipA && zipB) {
      return zipA.localeCompare(zipB);
    }
    return a.localeCompare(b, "de", { sensitivity: "base" });
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold">Wohnmobil Abstellplätze</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Finde Abstellplätze für dein Wohnmobil nach Postleitzahl. Übersicht aller verfügbaren Stellplätze in verschiedenen Regionen.
        </p>
      </div>

      {sortedPostalCodes.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Keine Artikel mit Postleitzahl-Kategorien gefunden.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {sortedPostalCodes.map((postalCodeCategory) => {
            const articles = articlesByPostalCode.get(postalCodeCategory)!;
            // Entferne Duplikate
            const uniqueArticles = Array.from(
              new Map(articles.map((a: Article) => [a.id, a])).values()
            );

            return (
              <section key={postalCodeCategory} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{decodeAmp(postalCodeCategory)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {uniqueArticles.length} Abstellplätze in diesem Postleitzahlen-Raum
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                  {uniqueArticles.map((article) => (
                    <Link key={article.id} href={getArticleUrl(article.slug, article.categories)}>
                      <Card className="h-full transition-shadow hover:shadow-lg">
                        <CardContent className="p-0">
                          {article.featuredImageUrl ? (
                            <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                              <Image
                                src={article.featuredImageUrl}
                                alt={article.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex aspect-video items-center justify-center bg-muted rounded-t-lg">
                              <ParkingCircle className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-6">
                            <h3 className="mb-2 text-xl font-semibold line-clamp-2">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="mb-4 line-clamp-3 text-muted-foreground">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(article.createdAt), "dd.MM.yyyy", {
                                  locale: de,
                                })}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

