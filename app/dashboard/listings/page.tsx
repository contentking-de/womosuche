import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
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
import { GeocodeMissingButton } from "@/components/listings/geocode-missing-button";
import { PublishListingButton } from "@/components/listings/publish-listing-button";
import { NewListingButton } from "@/components/listings/new-listing-button";
import { checkVehicleLimit } from "@/lib/subscription-limits";
import { Card, CardContent } from "@/components/ui/card";
import { Car } from "lucide-react";
import type { Listing } from "@prisma/client";

type ListingWithRelations = Listing & {
  User: { name: string | null; email: string | null };
  Image: Array<{ id: string; url: string; alt: string | null }>;
  _count: { Inquiry: number };
};

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
      User: {
        select: {
          name: true,
          email: true,
        },
      },
      Image: true,
      _count: {
        select: {
          Inquiry: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as ListingWithRelations[];

  // Zähle Listings ohne Koordinaten (für alle oder nur für den Benutzer)
  const missingCoordsConditions: any[] = [
    {
      OR: [
        { lat: null },
        { lng: null },
      ],
    },
    {
      location: {
        not: "",
      },
    },
  ];
  
  if (user.role !== "ADMIN") {
    missingCoordsConditions.push({ ownerId: user.id });
  }
  
  const missingCoordsCount = await prisma.listing.count({
    where: {
      AND: missingCoordsConditions,
    },
  });

  // Hole Vehicle-Limit für LANDLORD
  let vehicleLimitInfo = null;
  if (user.role === "LANDLORD") {
    vehicleLimitInfo = await checkVehicleLimit(user.id);
  }

  // Zähle alle Listings des Users (unabhängig von Filtern)
  const totalListingsCount = user.role === "ADMIN" 
    ? await prisma.listing.count()
    : await prisma.listing.count({
        where: { ownerId: user.id },
      });

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Überschrift */}
          <div className="flex-shrink-0">
            <h1 className="text-3xl font-bold">Wohnmobile</h1>
            <p className="mt-2 text-muted-foreground">
              Verwalten Sie Ihre Wohnmobile
            </p>
          </div>

          {/* Vehicle-Limit Anzeige für LANDLORD - zwischen Überschrift und Buttons */}
          {user.role === "LANDLORD" && vehicleLimitInfo && (
            <Card className="flex-1 min-w-[200px] max-w-[400px]">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <div>
                      {vehicleLimitInfo.planName ? (
                        <>
                          <p className="text-sm font-medium">
                            Wohnmobile im Plan enthalten
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {vehicleLimitInfo.planName} Plan
                          </p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-muted-foreground">
                          Kein aktives Abonnement
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {vehicleLimitInfo.maxCount === null ? (
                      vehicleLimitInfo.planName ? (
                        <p className="text-xl font-bold text-foreground">
                          {totalListingsCount} / ∞
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {totalListingsCount} vorhanden
                        </p>
                      )
                    ) : (
                      <p className={`text-xl font-bold ${
                        totalListingsCount >= vehicleLimitInfo.maxCount 
                          ? "text-red-600" 
                          : totalListingsCount >= vehicleLimitInfo.maxCount * 0.8 
                          ? "text-yellow-600" 
                          : "text-foreground"
                      }`}>
                        {totalListingsCount} / {vehicleLimitInfo.maxCount}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Buttons */}
          <div className="flex-shrink-0">
            {user.role === "LANDLORD" ? (
              <NewListingButton userId={user.id} userRole={user.role} />
            ) : (
              <Link href="/dashboard/listings/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Wohnmobil
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8">

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

      {/* Button zum Generieren fehlender Koordinaten */}
      {missingCoordsCount > 0 && (
        <div className="mb-4 p-4 bg-muted rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {missingCoordsCount} Wohnmobile ohne Koordinaten gefunden
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pro Durchlauf können maximal ~25-28 Wohnmobile geocodiert werden (Rate-Limit: 1/Sekunde).
                {missingCoordsCount > 28 && (
                  <span className="block mt-1">
                    Bitte klicken Sie mehrmals auf den Button, bis alle geocodiert sind.
                  </span>
                )}
              </p>
            </div>
            <GeocodeMissingButton />
          </div>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Bild</TableHead>
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
                <TableCell colSpan={user.role === "ADMIN" ? 9 : 8} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Wohnmobile vorhanden</p>
                  {user.role === "LANDLORD" ? (
                    <NewListingButton 
                      userId={user.id} 
                      userRole={user.role} 
                      variant="outline"
                      className="mt-4"
                    />
                  ) : (
                    <Link href="/dashboard/listings/new">
                      <Button variant="outline" className="mt-4">
                        Erstes Wohnmobil anlegen
                      </Button>
                    </Link>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              listings.map((listing: ListingWithRelations) => (
                <TableRow key={listing.id}>
                  <TableCell>
                    {listing.Image && listing.Image.length > 0 ? (
                      <div className="relative w-16 h-16 rounded-md overflow-hidden border">
                        <Image
                          src={listing.Image[0].url}
                          alt={listing.Image[0].alt || listing.title}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted border flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Kein Bild</span>
                      </div>
                    )}
                  </TableCell>
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
                    <TableCell>{listing.User.name || listing.User.email}</TableCell>
                  )}
                  <TableCell>{listing._count.Inquiry}</TableCell>
                  <TableCell>
                    {format(new Date(listing.createdAt), "dd.MM.yyyy", { locale: de })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Admin: Kann freigeben und zurückziehen | LANDLORD: Kann nur zurückziehen (wenn published) */}
                      {(user.role === "ADMIN" || (user.role === "LANDLORD" && listing.published)) && (
                        <PublishListingButton
                          listingId={listing.id}
                          published={listing.published}
                          userRole={user.role}
                        />
                      )}
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

