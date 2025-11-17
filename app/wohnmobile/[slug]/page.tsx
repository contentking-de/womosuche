import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InquiryForm } from "@/components/inquiries/inquiry-form";
import { MobileInquiryButton } from "@/components/listings/mobile-inquiry-button";
import { ListingImageGallery } from "@/components/listings/listing-image-gallery";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { MapPin, Users, Bed, Euro } from "lucide-react";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return {};
  const listing = await prisma.listing.findFirst({
    where: { slug, published: true },
    include: { images: true },
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
      images: listing.images.length > 0 ? [listing.images[0].url] : [],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }
  const listing = await prisma.listing.findFirst({
    where: { slug, published: true },
    include: {
      images: true,
      owner: {
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
    image: listing.images.length > 0 ? listing.images.map((img: typeof listing.images[number]) => img.url) : [],
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
            <ListingImageGallery images={listing.images} title={listing.title} />
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{listing.title}</h1>
              <div className="mt-2 flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{listing.location}</span>
                </div>
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
                <h2 className="mb-2 text-xl font-semibold">Ausstattung</h2>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feature: string) => (
                    <Badge key={feature} variant="secondary">
                      {feature}
                    </Badge>
                  ))}
                </div>
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

