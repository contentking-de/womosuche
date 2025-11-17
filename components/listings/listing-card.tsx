"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Listing, Image as ImageType } from "@prisma/client";
import { MapPin, Users, Bed, Euro } from "lucide-react";

interface ListingCardProps {
  listing: Listing & { images: ImageType[] };
}

export function ListingCard({ listing }: ListingCardProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = listing.images.length > 0 ? listing.images[0].url : null;
  const isVercelBlob = imageUrl?.includes("vercel-storage.com") ?? false;

  // Debug: Log Bild-Informationen
  if (typeof window !== "undefined" && listing.images.length > 0) {
    console.log(`ListingCard ${listing.title}:`, {
      imageCount: listing.images.length,
      firstImageUrl: listing.images[0].url,
      isJpeg: listing.images[0].url.includes(".jpeg"),
      isJpg: listing.images[0].url.includes(".jpg"),
    });
  }

  return (
    <Link href={`/wohnmobile/${listing.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          {imageUrl && !imageError ? (
            isVercelBlob ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              // Für externe Bilder (z.B. WordPress-Importe mit .jpeg) verwende normales img-Tag
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover"
                onError={() => {
                  console.error("Bild konnte nicht geladen werden:", imageUrl);
                  setImageError(true);
                }}
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">
                {imageError ? "Bild nicht verfügbar" : "Kein Bild"}
              </p>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold">{listing.title}</h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{listing.location}</span>
          </div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Euro className="h-4 w-4" />
                <span className="font-semibold">{listing.pricePerDay}</span>
                <span className="text-muted-foreground">/Tag</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{listing.seats}</span>
              </div>
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{listing.beds}</span>
              </div>
            </div>
          </div>
          {listing.features.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {listing.features.slice(0, 3).map((feature) => (
                <Badge key={feature} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {listing.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{listing.features.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

