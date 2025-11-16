import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Magazin</h1>
        <p className="mt-2 text-muted-foreground">
          Fachartikel rund um Camping und Wohnmobile
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Noch keine Artikel vorhanden</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article: typeof articles[number]) => (
            <Link key={article.id} href={`/magazin/${article.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <h2 className="mb-2 text-xl font-semibold">{article.title}</h2>
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
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

