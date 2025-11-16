import { requireAuth } from "@/lib/auth-helpers";
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
import { DeleteListingButton } from "@/components/listings/delete-listing-button";

export default async function ListingsPage() {
  const user = await requireAuth();

  const listings = await prisma.listing.findMany({
    where: user.role === "ADMIN" ? {} : { ownerId: user.id },
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
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titel</TableHead>
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
              listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell>{listing.location}</TableCell>
                  <TableCell>{listing.pricePerDay} €</TableCell>
                  <TableCell>
                    <Badge variant={listing.published ? "default" : "secondary"}>
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
                      <Link href={`/dashboard/listings/${listing.id}`}>
                        <Button variant="ghost" size="sm">
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

