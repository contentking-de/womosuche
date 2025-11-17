import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FileText, ArrowLeft } from "lucide-react";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  // Finde die Kategorie durch Vergleich der Slugs
  const allArticles = await prisma.article.findMany({
    where: { published: true },
    select: { categories: true },
  });

  const categoryMap = new Map<string, string>();
  for (const article of allArticles) {
    if (article.categories) {
      for (const cat of article.categories) {
        if (!shouldHideCategory(cat)) {
          const slug = generateSlug(cat);
          if (!categoryMap.has(slug)) {
            categoryMap.set(slug, cat);
          }
        }
      }
    }
  }

  const actualCategory = categoryMap.get(category);

  if (!actualCategory) {
    return {};
  }

  return {
    title: `${decodeAmp(actualCategory)} - Magazin`,
    description: `Alle Artikel aus der Kategorie ${decodeAmp(actualCategory)}`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  noStore();
  const { category } = await params;

  // Lade alle Artikel
  const allArticles = await prisma.article.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Finde die tatsächliche Kategorie durch Vergleich der Slugs
  const categoryMap = new Map<string, string>();
  for (const article of allArticles) {
    if (article.categories) {
      for (const cat of article.categories) {
        if (!shouldHideCategory(cat)) {
          const slug = generateSlug(cat);
          if (!categoryMap.has(slug)) {
            categoryMap.set(slug, cat);
          }
        }
      }
    }
  }

  const actualCategory = categoryMap.get(category);

  if (!actualCategory) {
    notFound();
  }

  // Filtere Artikel nach dieser Kategorie
  const categoryArticles = allArticles.filter(
    (article) =>
      article.categories &&
      article.categories.includes(actualCategory) &&
      !article.categories.some((cat) => shouldHideCategory(cat))
  );

  // Entferne Duplikate
  const uniqueArticles = Array.from(
    new Map(categoryArticles.map((a) => [a.id, a])).values()
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/magazin">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Magazin
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold">{decodeAmp(actualCategory)}</h1>
        <p className="mt-2 text-muted-foreground">
          {uniqueArticles.length} Artikel in dieser Kategorie
        </p>
      </div>

      {uniqueArticles.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Keine Artikel in dieser Kategorie vorhanden</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {uniqueArticles.map((article) => (
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
                    <h2 className="mb-2 text-xl font-semibold line-clamp-2">
                      {article.title}
                    </h2>
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
      )}
    </div>
  );
}

