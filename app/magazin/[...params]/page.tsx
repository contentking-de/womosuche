import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { unstable_noStore as noStore } from "next/cache";
import { TocSearchArticles } from "@/components/magazin/toc-search-articles";
import { RecentArticles } from "@/components/magazin/recent-articles";
import { NewsletterSubscriptionForm } from "@/components/newsletter/newsletter-subscription-form";
import { getFirstCategorySlug, generateSlug } from "@/lib/slug";

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

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugifyHeading(text: string, used: Record<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&[a-z0-9#]+;?/gi, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const seed = base || "abschnitt";
  if (!used[seed]) {
    used[seed] = 1;
    return seed;
  }
  used[seed] += 1;
  return `${seed}-${used[seed]}`;
}

function buildHtmlAndToc(html: string): { htmlWithIds: string; toc: TocItem[] } {
  const usedIds: Record<string, number> = {};
  const toc: TocItem[] = [];
  const headingRegex = /<(h[23])(\s[^>]*)?>([\s\S]*?)<\/\1>/gi;

  const htmlWithIds = html.replace(headingRegex, (match, tagName, rawAttrs = "", inner) => {
    const level = tagName === "h2" ? 2 : 3;
    const hasId = /\sid\s*=\s*["'][^"']+["']/.test(rawAttrs);
    const text = String(inner).replace(/<[^>]*>/g, "").trim();
    let id: string | undefined;

    if (hasId) {
      const m = rawAttrs.match(/\sid\s*=\s*["']([^"']+)["']/i);
      id = m?.[1];
    } else {
      id = slugifyHeading(text, usedIds);
      rawAttrs = `${rawAttrs ?? ""} id="${id}"`;
    }

    if (id && text) {
      toc.push({ id, text, level });
    }
    return `<${tagName}${rawAttrs}>${inner}</${tagName}>`;
  });

  return { htmlWithIds, toc };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ params: string[] }>;
}) {
  noStore();
  const { params: routeParams } = await params;
  
  // Erwarte entweder [slug] oder [category, slug]
  if (routeParams.length === 0 || routeParams.length > 2) {
    return {};
  }
  
  const slug = routeParams.length === 1 ? routeParams[0] : routeParams[1];
  const category = routeParams.length === 2 ? routeParams[0] : null;
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
  });

  if (!article) {
    return {};
  }

  // Wenn eine Kategorie angegeben ist, prüfe ob sie übereinstimmt
  if (category) {
    if (article.categories && article.categories.length > 0) {
      // Filtere ausgeblendete Kategorien heraus
      const validCategories = article.categories.filter(
        (cat: string) => !shouldHideCategory(cat)
      );
      
      // Prüfe, ob eine der gültigen Kategorien mit der URL-Kategorie übereinstimmt
      const categoryMatches = validCategories.some((cat: string) => {
        const catSlug = generateSlug(cat);
        return catSlug === category;
      });
      
      if (!categoryMatches) {
        return {};
      }
    } else {
      return {};
    }
  }

  return {
    title: `${article.title} - Magazin`,
    description: article.excerpt || article.content.substring(0, 160),
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ params: string[] }>;
}) {
  noStore();
  const { params: routeParams } = await params;
  
  // Erwarte entweder [slug] oder [category, slug]
  if (routeParams.length === 0 || routeParams.length > 2) {
    notFound();
  }
  
  const slug = routeParams.length === 1 ? routeParams[0] : routeParams[1];
  const category = routeParams.length === 2 ? routeParams[0] : null;
  
  // Versuche zuerst den Artikel direkt zu finden
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
  });

  if (!article) {
    notFound();
  }

  // Wenn keine Kategorie in der URL angegeben ist, leite zur URL mit Kategorie um
  if (!category) {
    if (article.categories && article.categories.length > 0) {
      const firstCategorySlug = getFirstCategorySlug(article.categories);
      if (firstCategorySlug) {
        redirect(`/magazin/${firstCategorySlug}/${slug}`);
      } else {
        // Wenn keine gültige Kategorie vorhanden, zeige den Artikel trotzdem an
        // (Fallback für Artikel ohne Kategorien)
      }
    }
  } else {
    // Wenn eine Kategorie angegeben ist, prüfe ob sie übereinstimmt
    if (article.categories && article.categories.length > 0) {
      // Filtere ausgeblendete Kategorien heraus
      const validCategories = article.categories.filter(
        (cat: string) => !shouldHideCategory(cat)
      );
      
      // Wenn nur ausgeblendete Kategorien vorhanden sind, zeige den Artikel trotzdem an
      if (validCategories.length === 0) {
        // Artikel ohne gültige Kategorien anzeigen
      } else {
        // Prüfe, ob eine der gültigen Kategorien mit der URL-Kategorie übereinstimmt
        const categoryMatches = validCategories.some((cat: string) => {
          const catSlug = generateSlug(cat);
          return catSlug === category;
        });
        
        // Wenn die Kategorie nicht übereinstimmt, leite zur korrekten URL um (erste Kategorie)
        if (!categoryMatches) {
          const firstCategorySlug = getFirstCategorySlug(article.categories);
          if (firstCategorySlug) {
            redirect(`/magazin/${firstCategorySlug}/${slug}`);
          }
        }
      }
    }
  }

  const { htmlWithIds, toc } = buildHtmlAndToc(article.content ?? "");
  const grouped = (() => {
    const groups: { id: string; text: string; children: TocItem[] }[] = [];
    for (const item of toc) {
      if (item.level === 2) {
        groups.push({ id: item.id, text: item.text, children: [] });
      } else if (groups.length > 0) {
        groups[groups.length - 1].children.push(item);
      }
    }
    return groups;
  })();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/magazin">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Magazin
        </Button>
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
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
                <p className="mb-6 text-xl font-semibold text-muted-foreground">{article.excerpt}</p>
              )}
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: htmlWithIds,
                }}
              />
            </CardContent>
          </Card>

          {/* Newsletter Subscription Form */}
          <div className="mt-8">
            <NewsletterSubscriptionForm />
          </div>
        </div>
        <aside className="hidden lg:col-span-4 xl:col-span-3 lg:block">
          <Card>
            <CardContent className="p-6">
              <div className="sticky top-24">
                <TocSearchArticles />
                {grouped.length > 0 && (
                  <>
                    <p className="text-lg font-bold text-foreground">Inhalt</p>
                    <nav className="mt-4 text-sm">
                      <ul className="space-y-2">
                        {grouped.map((section) => (
                          <li key={section.id}>
                            <a
                              href={`#${section.id}`}
                              className="text-sky-700/80 hover:text-sky-700 dark:text-sky-300/80 dark:hover:text-sky-300"
                            >
                              {section.text}
                            </a>
                            {section.children.length > 0 && (
                              <ul className="mt-2 ml-4 space-y-1">
                                {section.children.map((child) => (
                                  <li key={child.id}>
                                    <a
                                      href={`#${child.id}`}
                                      className="text-sky-700/70 hover:text-sky-700 dark:text-sky-300/70 dark:hover:text-sky-300"
                                    >
                                      {child.text}
                                    </a>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </>
                )}
                <RecentArticles currentSlug={slug} />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

