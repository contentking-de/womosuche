import { requireAdmin } from "@/lib/auth-helpers";
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
import { Plus, Pencil, Trash2, FileText } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DeleteGlossaryTermButton } from "@/components/lexikon/delete-term-button";
import type { GlossaryTerm } from "@prisma/client";

export default async function LexikonPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params?.q || "").trim();

  const where =
    q.length > 0
      ? {
          OR: [
            { term: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {};

  const terms = (await prisma.glossaryTerm.findMany({
    where,
    orderBy: {
      term: "asc",
    },
  })) as GlossaryTerm[];

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lexikon</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Fachbegriffe aus der Camping- und Wohnmobilwelt
          </p>
        </div>
        <div className="flex w-full items-end gap-3 md:w-auto">
          <form action="/dashboard/lexikon" className="flex w-full items-center gap-2">
            <Input
              name="q"
              placeholder="Begriff oder Slug suchen…"
              defaultValue={q}
            />
            <Button type="submit" variant="outline">Suchen</Button>
          </form>
          <Link href="/dashboard/lexikon/batch">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Batch-Erstellung
            </Button>
          </Link>
          <Link href="/dashboard/lexikon/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neuer Begriff
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Begriff</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {terms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Begriffe vorhanden</p>
                  <Link href="/dashboard/lexikon/new">
                    <Button variant="outline" className="mt-4">
                      Ersten Begriff anlegen
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              terms.map((term: GlossaryTerm) => (
                <TableRow key={term.id}>
                  <TableCell className="font-medium">{term.term}</TableCell>
                  <TableCell className="text-muted-foreground">{term.slug}</TableCell>
                  <TableCell>
                    {format(new Date(term.createdAt), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/lexikon/${term.id}`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteGlossaryTermButton termId={term.id} />
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

