import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { geocodeLocation } from "@/lib/geocode";
import { calculateDistance } from "@/lib/distance";
import type { Prisma } from "@prisma/client";

interface SearchParams {
  location?: string;
  radius?: string;
  minPrice?: string;
  maxPrice?: string;
  minSeats?: string;
  minBeds?: string;
  features?: string;
  page?: string;
}

const ITEMS_PER_PAGE = 12;

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: any = {
    published: true,
  };

  // Umkreissuche: Wenn Standort angegeben ist, verwende Geocoding
  let searchCenter: { lat: number; lng: number } | null = null;
  let radiusKm: number | null = null;

  if (params.location) {
    radiusKm = params.radius ? parseInt(params.radius) : 50; // Standard: 50km wenn kein Radius angegeben
    searchCenter = await geocodeLocation(params.location);
  }

  // Wenn keine Umkreissuche, verwende normale Textsuche
  if (params.location && !searchCenter) {
    where.location = {
      contains: params.location,
      mode: "insensitive",
    };
  }

  if (params.minPrice || params.maxPrice) {
    where.pricePerDay = {};
    if (params.minPrice) {
      where.pricePerDay.gte = parseInt(params.minPrice);
    }
    if (params.maxPrice) {
      where.pricePerDay.lte = parseInt(params.maxPrice);
    }
  }

  if (params.minSeats) {
    where.seats = {
      gte: parseInt(params.minSeats),
    };
  }

  if (params.minBeds) {
    where.beds = {
      gte: parseInt(params.minBeds),
    };
  }

  if (params.features) {
    const features = Array.isArray(params.features)
      ? params.features
      : [params.features];
    where.features = {
      hasSome: features,
    };
  }

  // Für Umkreissuche: Lade alle Listings mit Koordinaten, dann filtere nach Entfernung
  type ListingWithImages = Prisma.ListingGetPayload<{
    include: { Image: true };
  }> & { images: any[] };
  type ListingWithDistance = ListingWithImages & { distance: number };
  let listings: (ListingWithImages & { distance?: number })[] = [];
  let totalCount = 0;

  if (searchCenter && radiusKm) {
    // Lade alle Listings mit Koordinaten (andere Filter werden bereits in where angewendet)
    const allListings = await prisma.listing.findMany({
      where: {
        ...where,
        lat: { not: null },
        lng: { not: null },
      },
      include: {
        Image: {
          take: 1,
        },
      },
    });

    // Transformiere Image zu images
    const allListingsWithImages = allListings.map((l: any) => ({
      ...l,
      images: l.Image || [],
    }));

    // Berechne Entfernung und filtere nach Radius
    const listingsWithDistance = allListingsWithImages
      .map((listing: ListingWithImages): ListingWithDistance => {
        const distance = calculateDistance(
          searchCenter!.lat,
          searchCenter!.lng,
          listing.lat!,
          listing.lng!
        );
        return { ...listing, distance };
      })
      .filter((listing: ListingWithDistance) => listing.distance <= radiusKm!)
      .sort((a: ListingWithDistance, b: ListingWithDistance) => a.distance - b.distance); // Sortiere nach Entfernung

    totalCount = listingsWithDistance.length;
    listings = listingsWithDistance.slice(skip, skip + ITEMS_PER_PAGE);
  } else {
    // Normale Suche ohne Umkreis
    const [listingsResult, countResult] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          Image: {
            take: 1,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: ITEMS_PER_PAGE,
      }),
      prisma.listing.count({ where }),
    ]);

    listings = listingsResult;
    totalCount = countResult;
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Wohnmobile mieten</h1>
        <p className="mt-2 text-muted-foreground">
          Finde und miete das perfekte Wohnmobil für deinen nächsten Trip – vom kompakten Campervan bis zum großzügigen Familienmobil. Filtere nach Preis, Sitzplätzen, Betten, Ausstattung und Standort, vergleiche Angebote und buche direkt bei verifizierten Vermietern.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>Lädt Filter...</div>}>
            <ListingFilters />
          </Suspense>
        </aside>

        <div className="lg:col-span-3">
          {listings.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <p className="text-lg text-muted-foreground">
                Keine Wohnmobile gefunden
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Versuchen Sie, Ihre Filter anzupassen
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {totalCount} Wohnmobile gefunden
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing: typeof listings[number]) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link
                      href={{
                        pathname: "/wohnmobile",
                        query: { ...params, page: page - 1 },
                      }}
                    >
                      <Button variant="outline">Zurück</Button>
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Seite {page} von {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={{
                        pathname: "/wohnmobile",
                        query: { ...params, page: page + 1 },
                      }}
                    >
                      <Button variant="outline">Weiter</Button>
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

