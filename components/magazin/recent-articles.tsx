import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { FileText } from "lucide-react";
import { getArticleUrl } from "@/lib/slug";

interface RecentArticlesProps {
  currentSlug: string;
}

type ArticlePreview = {
  id: string;
  title: string;
  slug: string;
  createdAt: Date;
  featuredImageUrl: string | null;
  categories: string[] | null;
};

export async function RecentArticles({ currentSlug }: RecentArticlesProps) {
  const articles = await prisma.article.findMany({
    where: {
      published: true,
      slug: {
        not: currentSlug,
      },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      featuredImageUrl: true,
      categories: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 15,
  }) as ArticlePreview[];

  if (articles.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-bold text-foreground mb-4">Weitere Artikel</h3>
      <nav className="space-y-3">
        {articles.map((article: ArticlePreview) => (
          <Link
            key={article.id}
            href={getArticleUrl(article.slug, article.categories)}
            className="flex gap-3 group"
          >
            <div className="relative flex-shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted">
              {article.featuredImageUrl ? (
                <Image
                  src={article.featuredImageUrl}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform"
                  sizes="64px"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              <p className="font-medium line-clamp-2 mb-1">{article.title}</p>
              <span className="text-xs">
                {format(new Date(article.createdAt), "dd.MM.yyyy", {
                  locale: de,
                })}
              </span>
            </div>
          </Link>
        ))}
      </nav>
    </div>
  );
}

