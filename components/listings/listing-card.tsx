"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Listing, Image as ImageType } from "@prisma/client";
import { MapPin, Users, Bed, Euro } from "lucide-react";

interface ListingCardProps {
  listing: Listing & { images: ImageType[]; distance?: number };
}

export function ListingCard({ listing }: ListingCardProps) {
  const imageUrl = listing.images.length > 0 ? listing.images[0].url : null;
  const isVercelBlob = imageUrl?.includes("vercel-storage.com") ?? false;

  return (
    <Link href={`/wohnmobile/${listing.slug}`}>
      <Card className="h-full transition-shadow hover:shadow-lg">
        <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
          {imageUrl ? (
            isVercelBlob ? (
              <Image
                src={imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <img
                src={imageUrl}
                alt={listing.title}
                className="h-full w-full object-cover"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center bg-muted">
              <p className="text-sm text-muted-foreground">Kein Bild</p>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="mb-2 line-clamp-2 font-semibold">{listing.title}</h3>
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{listing.location}</span>
            {listing.distance !== undefined && (
              <span className="ml-2 text-xs font-medium text-primary">
                • {listing.distance} km entfernt
              </span>
            )}
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

