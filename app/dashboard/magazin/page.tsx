import { requireAdminOrEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DeleteArticleButton } from "@/components/magazin/delete-article-button";
import type { Article } from "@prisma/client";

function decodeAmp(value: string): string {
  return value.replace(/&amp;/g, "&");
}

export default async function MagazinPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  await requireAdminOrEditor();
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const category = (params?.category || "").trim();

  const where = {
    AND: [
      q.length > 0
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      category
        ? {
            categories: { has: category },
          }
        : {},
    ],
  } as any;

  const articles = (await prisma.article.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  })) as Article[];

  // Alle Kategorien aggregieren (für Filter-Dropdown)
  const allCatsRows = await prisma.article.findMany({
    select: { categories: true },
  });
  const categorySet = new Set<string>();
  for (const row of allCatsRows) {
    for (const c of row.categories || []) {
      if (c) categorySet.add(c);
    }
  }
  const allCategories = Array.from(categorySet).sort((a, b) =>
    a.localeCompare(b, "de", { sensitivity: "base" })
  );

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Magazin</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Fachartikel für das Magazin
          </p>
        </div>
        <div className="flex w-full items-end gap-3 md:w-auto">
          <form action="/dashboard/magazin" className="flex w-full items-center gap-2">
            <Input
              name="q"
              placeholder="Titel, Slug oder Inhalt suchen…"
              defaultValue={q}
            />
            <select
              name="category"
              defaultValue={category}
              className="h-9 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Alle Kategorien</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {decodeAmp(cat)}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline">Filtern</Button>
          </form>
          <Link href="/dashboard/magazin/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Artikel
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Titel</TableHead>
              <TableHead className="w-[22%]">Kategorien</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Erstellt</TableHead>
              <TableHead className="w-[120px] text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Artikel vorhanden</p>
                  <Link href="/dashboard/magazin/new">
                    <Button variant="outline" className="mt-4">
                      Ersten Artikel anlegen
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article: Article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-[420px] truncate">
                    {article.title}
                  </TableCell>
                  <TableCell className="max-w-[320px]">
                    <div className="flex flex-wrap gap-1">
                      {Array.isArray(article.categories) && article.categories.length > 0 ? (
                        article.categories.map((cat, idx) => (
                          <Badge key={`${cat}-${idx}`} variant="secondary">
                            {decodeAmp(cat)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "success" : "secondary"}>
                      {article.published ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(article.createdAt), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/magazin/${article.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteArticleButton articleId={article.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

