import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
  });

  if (!article) {
    return {};
  }

  return {
    title: `${article.title} - Magazin`,
    description: article.excerpt || article.content.substring(0, 160),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  noStore();
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
  });

  if (!article) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/magazin">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Magazin
        </Button>
      </Link>

      <Card>
        <CardContent className="p-8">
          <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
            <span>
              {format(new Date(article.createdAt), "dd.MM.yyyy", { locale: de })}
            </span>
            {article.tags.length > 0 && (
              <div className="flex gap-2">
                {article.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <h1 className="mb-4 text-4xl font-bold">{article.title}</h1>
          {article.excerpt && (
            <p className="mb-6 text-xl text-muted-foreground">{article.excerpt}</p>
          )}
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: article.content.replace(/\n/g, "<br />"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

