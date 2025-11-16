import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TocSearch } from "@/components/lexikon/toc-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function emphasizeDefinitionSection(html: string): string {
  try {
    // 1) Versuche eine explizite Definition-Section zu finden: <h2>Definition</h2> … bis zum nächsten <h2>
    const defHeading = /<h2[^>]*>\s*Definition\s*<\/h2>/i;
    const defMatch = defHeading.exec(html);
    if (defMatch) {
      const defEndIdx = defMatch.index + defMatch[0].length;
      const nextH2 = /<h2\b[^>]*>/gi;
      nextH2.lastIndex = defEndIdx;
      const nextMatch = nextH2.exec(html);
      const sectionEnd = nextMatch ? nextMatch.index : html.length;
      const before = html.slice(0, defEndIdx);
      const section = html.slice(defEndIdx, sectionEnd);
      const after = html.slice(sectionEnd);
      return `${before}<div class="rounded-lg border border-primary p-4 mb-6 font-semibold">${section}</div>${after}`;
    }
    // 2) Fallback: ersten Absatz hervorheben
    const firstP = /<p\b[^>]*>[\s\S]*?<\/p>/i.exec(html);
    if (firstP && typeof firstP.index === "number") {
      const start = firstP.index;
      const end = start + firstP[0].length;
      return `${html.slice(0, start)}<div class="rounded-lg border border-primary p-4 mb-6 font-semibold">${html.slice(
        start,
        end
      )}</div>${html.slice(end)}`;
    }
    return html;
  } catch {
    return html;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return {};
  const term = await prisma.glossaryTerm.findFirst({
    where: { slug },
  });

  if (!term) {
    return {};
  }

  return {
    title: `${term.term} - Lexikon`,
    description: term.content.substring(0, 160),
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }
  const term = await prisma.glossaryTerm.findFirst({
    where: { slug },
  });

  if (!term) {
    notFound();
  }

  const { htmlWithIds, toc } = buildHtmlAndToc(term.content);
  const htmlWithLead = emphasizeDefinitionSection(htmlWithIds);
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
      <Link href="/lexikon">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Lexikon
        </Button>
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
          <Card>
            <CardContent className="p-8">
              <h1 className="mb-6 text-4xl font-bold">{term.term}</h1>
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{
                  __html: htmlWithLead,
                }}
              />
            </CardContent>
          </Card>
        </div>
        <aside className="hidden lg:col-span-4 xl:col-span-3 lg:block">
          <Card>
            <CardContent className="p-6">
              <div className="sticky top-24">
                <TocSearch />
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
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

