"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  listingId?: string;
  existingImages?: Array<{ id: string; url: string; alt?: string | null }>;
  onImagesChange?: (images: Array<{ url: string }>) => void;
}

export function ImageUpload({
  listingId,
  existingImages = [],
  onImagesChange,
}: ImageUploadProps) {
  const [images, setImages] = useState<Array<{ url: string; id?: string }>>(
    existingImages.map((img) => ({ url: img.url, id: img.id }))
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError(null);
      setUploading(true);

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          if (listingId) {
            formData.append("listingId", listingId);
          }

          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Upload fehlgeschlagen");
          }

          return await response.json();
        });

        const results = await Promise.all(uploadPromises);
        const newImages = results.map((r) => ({ url: r.url }));
        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);
        onImagesChange?.(updatedImages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Fehler beim Hochladen");
      } finally {
        setUploading(false);
      }
    },
    [images, listingId, onImagesChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeImage = async (index: number) => {
    const image = images[index];
    if (image.id) {
      // Lösche aus Datenbank
      try {
        await fetch(`/api/images/${image.id}`, {
          method: "DELETE",
        });
      } catch (err) {
        console.error("Delete error:", err);
      }
    }

    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange?.(updatedImages);
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        {isDragActive ? (
          <p className="text-sm text-muted-foreground">
            Dateien hier ablegen...
          </p>
        ) : (
          <div>
            <p className="text-sm text-muted-foreground">
              Ziehen Sie Bilder hierher oder klicken Sie zum Auswählen
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              PNG, JPG, WEBP bis zu 10MB
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {uploading && (
        <div className="text-sm text-muted-foreground">Wird hochgeladen...</div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border">
                <Image
                  src={image.url}
                  alt={image.alt || `Bild ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

