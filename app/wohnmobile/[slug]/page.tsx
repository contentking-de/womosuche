import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { MobileInquiryButton } from "@/components/listings/mobile-inquiry-button";
import { ListingImageGallery } from "@/components/listings/listing-image-gallery";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import { EquipmentDisplay } from "@/components/listings/equipment-display";
import { ScrollToInquiryButton } from "@/components/listings/scroll-to-inquiry-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Users, Bed, Euro } from "lucide-react";
import { normalizeBrandFromUrl, brandToUrl } from "@/lib/brands";
import { geocodeLocation } from "@/lib/geocode";
import { calculateDistance } from "@/lib/distance";
import { Suspense } from "react";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return {};
  
  // Prüfe zuerst, ob es eine Marke ist
  const normalizedBrand = normalizeBrandFromUrl(slug);
  if (normalizedBrand) {
    return {
      title: `${normalizedBrand} Wohnmobile mieten - Wohnmobil Vermietung`,
      description: `Finde und miete ${normalizedBrand} Wohnmobile für deinen nächsten Trip. Filtere nach Preis, Sitzplätzen, Betten, Ausstattung und Standort.`,
    };
  }
  
  // Prüfe, ob es eine Stadt ist
  const normalizedLocation = decodeURIComponent(slug).trim();
  const firstListingForMeta = await prisma.listing.findFirst({
    where: {
      published: true,
      location: {
        equals: normalizedLocation,
        mode: "insensitive",
      },
    },
    select: {
      location: true,
    },
  });
  
  if (firstListingForMeta) {
    const correctLocationMeta = firstListingForMeta.location;
    return {
      title: `Wohnmobile mieten in ${correctLocationMeta} - Wohnmobil Vermietung`,
      description: `Finde und miete Wohnmobile in ${correctLocationMeta} für deinen nächsten Trip. Filtere nach Preis, Sitzplätzen, Betten, Ausstattung und Standort.`,
    };
  }
  
  const listing = await prisma.listing.findFirst({
    where: { slug, published: true },
    include: { Image: true },
  });

  if (!listing) {
    return {};
  }

  return {
    title: `${listing.title} - Wohnmobil Vermietung`,
    description: listing.description.substring(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.substring(0, 160),
      images: listing.Image.length > 0 ? [listing.Image[0].url] : [],
    },
  };
}

interface SearchParams {
  location?: string;
  radius?: string;
  minPrice?: string;
  maxPrice?: string;
  minSeats?: string;
  minBeds?: string;
  features?: string;
  marke?: string;
  page?: string;
}

const ITEMS_PER_PAGE = 12;

export default async function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<SearchParams>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }
  
  // Prüfe zuerst, ob es eine Marke ist
  const normalizedBrand = normalizeBrandFromUrl(slug);
  if (normalizedBrand) {
    // Redirect zu kleingeschriebener URL, falls nötig
    const lowerSlug = slug.toLowerCase();
    if (slug !== lowerSlug) {
      redirect(`/wohnmobile/${encodeURIComponent(lowerSlug)}`);
    }
    
    // Zeige Marken-Seite
    const params_search = await (searchParams || Promise.resolve({} as SearchParams));
    const page = parseInt(params_search.page || "1");
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // normalizedBrand enthält bereits den korrekten Markennamen (z.B. "Hymer")
    // daher können wir equals verwenden
    const where: any = {
      published: true,
      marke: normalizedBrand,
    };

    // Umkreissuche: Wenn Standort angegeben ist, verwende Geocoding
    let searchCenter: { lat: number; lng: number } | null = null;
    let radiusKm: number | null = null;

    if (params_search.location) {
      radiusKm = params_search.radius ? parseInt(params_search.radius) : 50;
      searchCenter = await geocodeLocation(params_search.location);
    }

    // Wenn keine Umkreissuche, verwende normale Textsuche
    if (params_search.location && !searchCenter) {
      where.location = {
        contains: params_search.location,
        mode: "insensitive",
      };
    }

    if (params_search.minPrice || params_search.maxPrice) {
      where.pricePerDay = {};
      if (params_search.minPrice) {
        where.pricePerDay.gte = parseInt(params_search.minPrice);
      }
      if (params_search.maxPrice) {
        where.pricePerDay.lte = parseInt(params_search.maxPrice);
      }
    }

    if (params_search.minSeats) {
      where.seats = {
        gte: parseInt(params_search.minSeats),
      };
    }

    if (params_search.minBeds) {
      where.beds = {
        gte: parseInt(params_search.minBeds),
      };
    }

    if (params_search.features) {
      const features = Array.isArray(params_search.features)
        ? params_search.features
        : [params_search.features];
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

      const allListingsWithImages = allListings.map((l: any) => ({
        ...l,
        images: l.Image || [],
      }));

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
        .sort((a: ListingWithDistance, b: ListingWithDistance) => a.distance - b.distance);

      totalCount = listingsWithDistance.length;
      listings = listingsWithDistance.slice(skip, skip + ITEMS_PER_PAGE);
    } else {
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

      listings = listingsResult.map((l: any) => ({
        ...l,
        images: l.Image || [],
      }));
      totalCount = countResult;
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{normalizedBrand} Wohnmobile mieten</h1>
          <p className="mt-2 text-muted-foreground">
            Finde und miete {normalizedBrand} Wohnmobile für deinen nächsten Trip – vom kompakten Campervan bis zum großzügigen Familienmobil. Filtere nach Preis, Sitzplätzen, Betten, Ausstattung und Standort, vergleiche Angebote und buche direkt bei verifizierten Vermietern.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <Suspense fallback={<div>Lädt Filter...</div>}>
              <ListingFilters brand={normalizedBrand} />
            </Suspense>
          </aside>

          <div className="lg:col-span-3">
            {listings.length === 0 ? (
              <div className="rounded-lg border p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Keine {normalizedBrand} Wohnmobile gefunden
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Versuchen Sie, Ihre Filter anzupassen
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {totalCount} {normalizedBrand} Wohnmobile gefunden
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
                          pathname: `/wohnmobile/${brandToUrl(normalizedBrand)}`,
                          query: { ...params_search, page: page - 1 },
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
                          pathname: `/wohnmobile/${brandToUrl(normalizedBrand)}`,
                          query: { ...params_search, page: page + 1 },
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
  
  // Prüfe, ob es eine Stadt ist (nur wenn es keine Marke war)
  // Normalisiere den Slug für die Suche
  const normalizedLocation = decodeURIComponent(slug).trim();
  
  // Prüfe, ob es Listings mit dieser Stadt gibt und hole die korrekte Schreibweise
  const firstListing = await prisma.listing.findFirst({
    where: {
      published: true,
      location: {
        equals: normalizedLocation,
        mode: "insensitive",
      },
    },
    select: {
      location: true,
    },
  });
  
  if (firstListing) {
    // Verwende die korrekte Schreibweise aus der DB
    const correctLocation = firstListing.location;
    
    // Redirect zu kleingeschriebener URL, falls nötig
    const lowerSlug = slug.toLowerCase();
    if (slug !== lowerSlug) {
      redirect(`/wohnmobile/${encodeURIComponent(lowerSlug)}`);
    }
    
    // Zeige Stadt-Seite
    const params_search = await (searchParams || Promise.resolve({} as SearchParams));
    const page = parseInt(params_search.page || "1");
    const skip = (page - 1) * ITEMS_PER_PAGE;

    const where: any = {
      published: true,
      location: {
        equals: correctLocation,
        mode: "insensitive",
      },
    };

    // Umkreissuche: Wenn Standort angegeben ist, verwende Geocoding
    let searchCenter: { lat: number; lng: number } | null = null;
    let radiusKm: number | null = null;

    if (params_search.location) {
      radiusKm = params_search.radius ? parseInt(params_search.radius) : 50;
      searchCenter = await geocodeLocation(params_search.location);
    }

    // Wenn keine Umkreissuche, verwende normale Textsuche
    if (params_search.location && !searchCenter) {
      where.location = {
        contains: params_search.location,
        mode: "insensitive",
      };
    }

    if (params_search.minPrice || params_search.maxPrice) {
      where.pricePerDay = {};
      if (params_search.minPrice) {
        where.pricePerDay.gte = parseInt(params_search.minPrice);
      }
      if (params_search.maxPrice) {
        where.pricePerDay.lte = parseInt(params_search.maxPrice);
      }
    }

    if (params_search.minSeats) {
      where.seats = {
        gte: parseInt(params_search.minSeats),
      };
    }

    if (params_search.minBeds) {
      where.beds = {
        gte: parseInt(params_search.minBeds),
      };
    }

    if (params_search.features) {
      const features = Array.isArray(params_search.features)
        ? params_search.features
        : [params_search.features];
      where.features = {
        hasSome: features,
      };
    }

    if (params_search.marke) {
      where.marke = params_search.marke;
    }

    // Für Umkreissuche: Lade alle Listings mit Koordinaten, dann filtere nach Entfernung
    type ListingWithImages = Prisma.ListingGetPayload<{
      include: { Image: true };
    }> & { images: any[] };
    type ListingWithDistance = ListingWithImages & { distance: number };
    let listings: (ListingWithImages & { distance?: number })[] = [];
    let totalCount = 0;

    if (searchCenter && radiusKm) {
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

      const allListingsWithImages = allListings.map((l: any) => ({
        ...l,
        images: l.Image || [],
      }));

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
        .sort((a: ListingWithDistance, b: ListingWithDistance) => a.distance - b.distance);

      totalCount = listingsWithDistance.length;
      listings = listingsWithDistance.slice(skip, skip + ITEMS_PER_PAGE);
    } else {
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

      listings = listingsResult.map((l: any) => ({
        ...l,
        images: l.Image || [],
      }));
      totalCount = countResult;
    }

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Wohnmobile mieten in {correctLocation}</h1>
          <p className="mt-2 text-muted-foreground">
            Finde und miete Wohnmobile in {correctLocation} für deinen nächsten Trip – vom kompakten Campervan bis zum großzügigen Familienmobil. Filtere nach Preis, Sitzplätzen, Betten, Ausstattung und Standort, vergleiche Angebote und buche direkt bei verifizierten Vermietern.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <Suspense fallback={<div>Lädt Filter...</div>}>
              <ListingFilters location={correctLocation} />
            </Suspense>
          </aside>

          <div className="lg:col-span-3">
            {listings.length === 0 ? (
              <div className="rounded-lg border p-12 text-center">
                <p className="text-lg text-muted-foreground">
                  Keine Wohnmobile in {correctLocation} gefunden
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Versuchen Sie, Ihre Filter anzupassen
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  {totalCount} Wohnmobile in {correctLocation} gefunden
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
                          pathname: `/wohnmobile/${encodeURIComponent(correctLocation.toLowerCase())}`,
                          query: { ...params_search, page: page - 1 },
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
                          pathname: `/wohnmobile/${encodeURIComponent(correctLocation.toLowerCase())}`,
                          query: { ...params_search, page: page + 1 },
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
  
  // Normale Listing-Detail-Seite
  const listing = await prisma.listing.findFirst({
    where: { slug, published: true },
    include: {
      Image: true,
      User: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!listing) {
    notFound();
  }

  const baseUrl = process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.Image.length > 0 ? listing.Image.map((img: typeof listing.Image[number]) => img.url) : [],
    offers: {
      "@type": "Offer",
      price: listing.pricePerDay,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.5",
      reviewCount: "10",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Bilder */}
          <div>
            <ListingImageGallery images={listing.Image} title={listing.title} />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
                {listing.marke && (
                  <Badge variant="outline" className="text-sm">
                    {listing.marke}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Euro className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Preis/Tag</p>
                  <p className="text-xl font-bold">{listing.pricePerDay} €</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Sitzplätze</p>
                  <p className="text-xl font-bold">{listing.seats}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Bed className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Betten</p>
                  <p className="text-xl font-bold">{listing.beds}</p>
                </div>
              </div>
            </div>

            <ScrollToInquiryButton />

            <Separator />

            <div>
              <h2 className="mb-2 text-xl font-semibold">Beschreibung</h2>
              <div
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: listing.description }}
              />
            </div>

            {listing.features.length > 0 && (
              <div>
                <h2 className="mb-2 text-xl font-semibold">Ausstattung (Basis)</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature: string) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {(listing.features.length > 0 || (listing as any).equipment) && <Separator />}

            {(listing as any).equipment && (
              <div>
                <h2 className="mb-4 text-xl font-semibold">Detaillierte Ausstattung</h2>
                <EquipmentDisplay equipment={(listing as any).equipment} />
              </div>
            )}

            <Separator />

            <div id="inquiry-form">
              <h2 className="mb-2 text-xl font-semibold">Buchungsanfrage stellen</h2>
              <p className="mb-4 text-muted-foreground">für {listing.title}</p>
              <InquiryForm listingId={listing.id} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Fixierter Button für Mobile-Geräte */}
      <MobileInquiryButton />
    </>
  );
}

