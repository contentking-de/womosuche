import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pencil, Eye } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { DeleteListingButton } from "@/components/listings/delete-listing-button";
import type { Listing } from "@prisma/client";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const status = params?.status;

  // Baue WHERE-Bedingung auf
  const whereConditions: any[] = [];

  // Basis-Filter: Nur eigene Listings für LANDLORD
  if (user.role !== "ADMIN") {
    whereConditions.push({ ownerId: user.id });
  }

  // Suchfilter
  if (q.length > 0) {
    whereConditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { location: { contains: q, mode: "insensitive" as const } },
      ],
    });
  }

  // Status-Filter
  if (status === "published") {
    whereConditions.push({ published: true });
  } else if (status === "draft") {
    whereConditions.push({ published: false });
  }

  // Kombiniere alle Bedingungen
  const where =
    whereConditions.length > 0
      ? { AND: whereConditions }
      : user.role !== "ADMIN"
      ? { ownerId: user.id }
      : {};

  const listings = (await prisma.listing.findMany({
    where,
    include: {
      owner: {
        select: {
          name: true,
          email: true,
        },
      },
      images: true,
      _count: {
        select: {
          inquiries: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as (Listing & {
    owner: { name: string | null; email: string | null };
    images: any[];
    _count: { inquiries: number };
  })[];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Wohnmobile</h1>
            <p className="mt-2 text-muted-foreground">
              Verwalten Sie Ihre Wohnmobile
            </p>
          </div>
          <Link href="/dashboard/listings/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Neues Wohnmobil
            </Button>
          </Link>
        </div>

        {/* Such- und Filter-Bereich */}
        <form action="/dashboard/listings" method="get" className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Titel oder Standort suchen…"
              defaultValue={q}
              className="pl-9"
            />
          </div>
          <Select name="status" defaultValue={status || "all"}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="published">Veröffentlicht</SelectItem>
              <SelectItem value="draft">Entwurf</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" variant="outline">
            <Search className="mr-2 h-4 w-4" />
            Suchen
          </Button>
          {(q || status) && (
            <Link href="/dashboard/listings">
              <Button type="button" variant="ghost">
                Zurücksetzen
              </Button>
            </Link>
          )}
        </form>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px] max-w-[200px]">Titel</TableHead>
              <TableHead>Standort</TableHead>
              <TableHead>Preis/Tag</TableHead>
              <TableHead>Status</TableHead>
              {user.role === "ADMIN" && <TableHead>Vermieter</TableHead>}
              <TableHead>Anfragen</TableHead>
              <TableHead>Erstellt</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {listings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={user.role === "ADMIN" ? 8 : 7} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Wohnmobile vorhanden</p>
                  <Link href="/dashboard/listings/new">
                    <Button variant="outline" className="mt-4">
                      Erstes Wohnmobil anlegen
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing: Listing & {
                owner: { name: string | null; email: string | null };
                images: any[];
                _count: { inquiries: number };
              }) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={listing.title}>
                    {listing.title}
                  </TableCell>
                  <TableCell>{listing.location}</TableCell>
                  <TableCell>{listing.pricePerDay} €</TableCell>
                  <TableCell>
                    <Badge variant={listing.published ? "success" : "default"}>
                      {listing.published ? "Veröffentlicht" : "Entwurf"}
                    </Badge>
                  </TableCell>
                  {user.role === "ADMIN" && (
                    <TableCell>{listing.owner.name || listing.owner.email}</TableCell>
                  )}
                  <TableCell>{listing._count.inquiries}</TableCell>
                  <TableCell>
                    {format(new Date(listing.createdAt), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {listing.slug && (
                        <Link href={`/wohnmobile/${listing.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" title="Vorschau anzeigen">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        <Button variant="ghost" size="sm" title="Bearbeiten">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <DeleteListingButton listingId={listing.id} />
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

