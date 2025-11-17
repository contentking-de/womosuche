import { prisma } from "@/lib/prisma";
import { ListingCard } from "@/components/listings/listing-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

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
      images: {
        orderBy: {
          createdAt: "asc", // Erstes Bild zuerst
        },
      },
    },
  });

  // Debug: Prüfe welche Bild-URLs vorhanden sind
  listings.forEach((listing) => {
    if (listing.images.length === 0) {
      console.log(`Listing ${listing.title} (${listing.slug}) hat keine Bilder`);
    } else {
      listing.images.forEach((img) => {
        if (img.url.includes(".jpeg")) {
          console.log(`Listing ${listing.title} hat .jpeg Bild: ${img.url}`);
        }
      });
    }
  });

  if (listings.length === 0) {
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
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}

