import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowRight, FileText } from "lucide-react";
import { getArticleUrl } from "@/lib/slug";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tags: string[];
  featuredImageUrl: string | null;
  createdAt: Date;
  categories: string[] | null;
}

interface MagazinSectionProps {
  articles: Article[];
}

export function MagazinSection({ articles }: MagazinSectionProps) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="border-t bg-muted/50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Aus unserem Magazin
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Fachartikel rund um Camping und Wohnmobile
            </p>
          </div>
          <Link href="/magazin">
            <Button size="lg" className="px-8 py-6 text-lg font-bold">
              Alle Artikel
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {articles.map((article) => (
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
                          {article.tags.slice(0, 2).map((tag) => (
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
      </div>
    </section>
  );
}

