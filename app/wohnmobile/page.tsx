import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

interface SearchParams {
  location?: string;
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

  if (params.location) {
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

  const [listings, totalCount] = await Promise.all([
    prisma.listing.findMany({
      where,
      include: {
        images: {
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

