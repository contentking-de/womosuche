import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Search } from "lucide-react";
import { DeleteUserButton } from "@/components/users/delete-user-button";
import type { User } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const role = params?.role;

  // Baue WHERE-Bedingung auf
  const whereConditions: any[] = [];

  // Suchfilter
  if (q.length > 0) {
    whereConditions.push({
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { email: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  // Rolle-Filter
  if (role === "ADMIN" || role === "LANDLORD") {
    whereConditions.push({ role });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const users = (await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  })) as Pick<User, "id" | "name" | "email" | "role" | "createdAt">[];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Benutzerverwaltung</h1>
            <p className="mt-2 text-muted-foreground">
              Übersicht aller registrierten Benutzer
            </p>
          </div>
          <Link href="/dashboard/users/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Benutzer
            </Button>
          </Link>
        </div>

        {/* Such- und Filter-Bereich */}
        <form action="/dashboard/users" method="get" className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Name oder E-Mail suchen…"
              defaultValue={q}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Suchen
          </Button>
          {q && (
            <Link href="/dashboard/users">
              <Button type="button" variant="ghost">
                Zurücksetzen
              </Button>
            </Link>
          )}
        </form>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Benutzer</CardTitle>
            <span className="text-sm text-muted-foreground">
              {users.length} {users.length === 1 ? "Benutzer" : "Benutzer"} gefunden
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>E-Mail</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead>Registriert am</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <p className="text-muted-foreground">
                        {q ? "Keine Benutzer gefunden" : "Noch keine Benutzer vorhanden"}
                      </p>
                      {q && (
                        <Link href="/dashboard/users">
                          <Button variant="outline" className="mt-4">
                            Suche zurücksetzen
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u: Pick<User, "id" | "name" | "email" | "role" | "createdAt">) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name ?? "–"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>
                        {format(new Date(u.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/users/${u.id}`}>
                            <Button size="sm" variant="outline">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <DeleteUserButton userId={u.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

