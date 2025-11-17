import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FileText, ArrowRight } from "lucide-react";
import { unstable_noStore as noStore } from "next/cache";
import { generateSlug } from "@/lib/slug";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, "&");
}

// Prüft, ob eine Kategorie ausgeblendet werden soll
function shouldHideCategory(category: string): boolean {
  const trimmed = category.trim();
  // Prüfe auf Postleitzahl-Kategorien
  const isPostalCode = /^Postleitzahl\s+\d{5}-\d{5}$/i.test(trimmed) || 
                       /^Postleitzahl/i.test(trimmed);
  // Prüfe auf "Wohnmobil Abstellplätze"
  const isAbstellplaetze = /^Wohnmobil\s+Abstellplätze/i.test(trimmed);
  
  return isPostalCode || isAbstellplaetze;
}

export default async function MagazinPage() {
  noStore();
  const articles = await prisma.article.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Gruppiere Artikel nach Kategorien (ohne Postleitzahlen)
  const articlesByCategory = new Map<string, typeof articles>();
  const uncategorizedArticles: typeof articles = [];

  for (const article of articles) {
    if (article.categories && article.categories.length > 0) {
      // Filtere ausgeblendete Kategorien heraus
      const validCategories = article.categories.filter(
        (cat) => !shouldHideCategory(cat)
      );

      if (validCategories.length > 0) {
        // Artikel können mehreren Kategorien angehören
        // Wir zeigen sie in allen ihren Kategorien (außer Postleitzahlen)
        for (const category of validCategories) {
          if (!articlesByCategory.has(category)) {
            articlesByCategory.set(category, []);
          }
          articlesByCategory.get(category)!.push(article);
        }
      } else {
        // Artikel hat nur Postleitzahl-Kategorien, behandeln als unkategorisiert
        uncategorizedArticles.push(article);
      }
    } else {
      uncategorizedArticles.push(article);
    }
  }

  // Sortiere Kategorien alphabetisch
  const sortedCategories = Array.from(articlesByCategory.keys()).sort((a, b) =>
    a.localeCompare(b, "de", { sensitivity: "base" })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold">Camping Magazin</h1>
        <div className="mt-4 space-y-3">
          <p className="text-lg leading-relaxed text-foreground max-w-4xl">
            Tauche ein in die faszinierende Welt des Campings und entdecke alles, was dein Abenteuer perfekt macht. 
            Von praktischen Ratgebern zu Wohnmobilen und Ausrüstung über inspirierende Reiseziele und 
            Campingplatz-Empfehlungen bis hin zu technischen Tipps, Wartungsanleitungen und Insider-Wissen – 
            hier findest du fundierte Artikel, die dich auf deiner nächsten Reise begleiten.
          </p>
          <p className="text-base leading-relaxed text-muted-foreground max-w-4xl">
            Egal ob du Anfänger bist und deine erste Camping-Tour planst, oder erfahrener Camper, der nach 
            neuen Inspirationen sucht: Unser Magazin bietet dir wertvolle Informationen zu Fahrzeugtypen, 
            Ausstattung, Sicherheit, Rechtliches, Reiseplanung und den schönsten Zielen in Deutschland und Europa. 
            Lass dich von Experten-Tipps, detaillierten Tests und persönlichen Erfahrungsberichten inspirieren 
            und mache dein Camping-Erlebnis zu etwas ganz Besonderem.
          </p>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Noch keine Artikel vorhanden</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Artikel nach Kategorien gruppiert */}
          {sortedCategories.map((category) => {
            const categoryArticles = articlesByCategory.get(category)!;
            // Entferne Duplikate (falls ein Artikel mehreren Kategorien angehört)
            const uniqueArticles = Array.from(
              new Map(categoryArticles.map((a) => [a.id, a])).values()
            );

            // Zeige nur die ersten 4 Artikel
            const displayedArticles = uniqueArticles.slice(0, 4);
            const categorySlug = generateSlug(category);

            return (
              <section key={category} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">{decodeAmp(category)}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {uniqueArticles.length} Artikel
                    </p>
                  </div>
                  {uniqueArticles.length > 4 && (
                    <Link href={`/magazin/kategorie/${categorySlug}`}>
                      <Button>
                        Alle Artikel anzeigen
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
                <Separator />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {displayedArticles.map((article) => (
                    <Link key={article.id} href={`/magazin/${article.slug}`}>
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
                              <FileText className="h-12 w-12 text-muted-foreground" />
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
                              {article.tags.length > 0 && (
                                <div className="flex gap-1">
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
  );
}

