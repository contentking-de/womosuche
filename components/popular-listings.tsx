import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/listing-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Listing, Image as ImageType } from "@prisma/client";

export async function PopularListings() {
  // Lade alle veröffentlichten Listing-IDs
  const allListingIds = await prisma.listing.findMany({
    where: { published: true },
    select: { id: true },
  });

  // Wähle zufällig 12 IDs aus
  const shuffled = allListingIds.sort(() => 0.5 - Math.random());
  const selectedIds = shuffled.slice(0, 12).map((l: { id: string }) => l.id);

  if (selectedIds.length === 0) {
    return null;
  }

  // Lade die vollständigen Listings mit Bildern
  const listings = await prisma.listing.findMany({
    where: {
      id: { in: selectedIds },
      published: true,
    },
    include: {
      Image: {
        orderBy: {
          createdAt: "asc", // Erstes Bild zuerst
        },
      },
    },
  });

  // Transformiere Image zu images für Kompatibilität mit Komponenten
  const listingsWithImages = listings.map((listing: any) => ({
    ...listing,
    images: listing.Image || [],
  }));

  if (listingsWithImages.length === 0) {
    return null;
  }

  return (
    <section className="border-t bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Beliebte Wohnmobile
            </h2>
            <p className="mt-2 text-lg text-muted-foreground">
              Entdecke unsere beliebtesten Wohnmobile für dein nächstes Abenteuer
            </p>
          </div>
          <Link href="/wohnmobile">
            <Button variant="outline" size="lg">
              Alle anzeigen
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {listingsWithImages.map((listing: Listing & { images: ImageType[] }) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}

