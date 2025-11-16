import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export default async function MagazinPage() {
  await requireAdmin();

  const articles = await prisma.article.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Magazin</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Fachartikel für das Magazin
          </p>
        </div>
        <Link href="/dashboard/magazin/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Neuer Artikel
          </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[45%]">Titel</TableHead>
              <TableHead className="w-[140px]">Status</TableHead>
              <TableHead className="w-[140px]">Erstellt</TableHead>
              <TableHead className="w-[120px] text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Artikel vorhanden</p>
                  <Link href="/dashboard/magazin/new">
                    <Button variant="outline" className="mt-4">
                      Ersten Artikel anlegen
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="font-medium max-w-[460px] truncate">
                    {article.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant={article.published ? "default" : "secondary"}>
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

