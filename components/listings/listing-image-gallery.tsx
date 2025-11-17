"use client";

import { useState } from "react";
import Image from "next/image";

interface ListingImageGalleryProps {
  images: Array<{ id: string; url: string }>;
  title: string;
}

export function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg border bg-muted">
        <p className="text-muted-foreground">Kein Bild verfügbar</p>
      </div>
    );
  }

  const selectedImage = images[selectedImageIndex];
  const isVercelBlob = selectedImage.url.includes("vercel-storage.com");

  return (
    <div className="space-y-4">
      {/* Hauptbild */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
        {isVercelBlob ? (
          <Image
            src={selectedImage.url}
            alt={`${title} - Bild ${selectedImageIndex + 1}`}
            fill
            className="object-cover"
            priority={selectedImageIndex === 0}
          />
        ) : (
          <img
            src={selectedImage.url}
            alt={`${title} - Bild ${selectedImageIndex + 1}`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => {
            const isThumbnailVercelBlob = image.url.includes("vercel-storage.com");
            const isSelected = index === selectedImageIndex;

            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setSelectedImageIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary ring-offset-2"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {isThumbnailVercelBlob ? (
                  <Image
                    src={image.url}
                    alt={`${title} - Thumbnail ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <img
                    src={image.url}
                    alt={`${title} - Thumbnail ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

