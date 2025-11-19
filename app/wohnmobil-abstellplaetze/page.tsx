import { prisma } from "@/lib/prisma";
import { unstable_noStore as noStore } from "next/cache";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="w-full overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 break-words">Wohnmobil Abstellplätze</h1>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground break-words">
            Finde Abstellplätze für dein Wohnmobil nach Postleitzahl. Übersicht aller verfügbaren Stellplätze in verschiedenen Regionen.
          </p>
        </div>

      {sortedPostalCodes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Keine Artikel mit Postleitzahl-Kategorien gefunden.</p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          {sortedPostalCodes.map((postalCodeCategory) => {
            const articles = articlesByPostalCode.get(postalCodeCategory)!;
            // Entferne Duplikate
            const uniqueArticles = Array.from(
              new Map(articles.map((a: Article) => [a.id, a])).values()
            );

            return (
              <section key={postalCodeCategory} className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold break-words pr-2 flex-1 min-w-0">{decodeAmp(postalCodeCategory)}</h2>
                  <Badge variant="secondary" className="w-fit text-xs sm:text-sm whitespace-normal shrink-0">
                    {uniqueArticles.length} Abstellplätze in diesem Postleitzahlen-Raum
                  </Badge>
                </div>

                <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
                  {uniqueArticles.map((article) => (
                    <Link key={article.id} href={getArticleUrl(article.slug, article.categories)} className="w-full min-w-0">
                      <Card className="h-full transition-shadow hover:shadow-lg w-full max-w-full">
                        <CardContent className="p-0 w-full">
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
                              <ParkingCircle className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-4 sm:p-6">
                            <h3 className="mb-2 text-lg sm:text-xl font-semibold line-clamp-2 break-words">
                              {article.title}
                            </h3>
                            {article.excerpt && (
                              <p className="mb-4 line-clamp-3 text-muted-foreground text-sm sm:text-base break-words">
                                {article.excerpt}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {format(new Date(article.createdAt), "dd.MM.yyyy", {
                                  locale: de,
                                })}
                              </span>
                              {article.tags && article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {article.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
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
    </div>
  );
}

