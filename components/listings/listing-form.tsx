"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Listing, Image } from "@prisma/client";
import { ImageUpload } from "./image-upload";
import { Separator } from "@/components/ui/separator";

const listingSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  pricePerDay: z.coerce.number().min(1, "Preis muss größer als 0 sein"),
  seats: z.coerce.number().min(1, "Mindestens 1 Sitzplatz erforderlich"),
  beds: z.coerce.number().min(1, "Mindestens 1 Bett erforderlich"),
  location: z.string().min(2, "Standort ist erforderlich"),
  features: z.array(z.string()),
  published: z.boolean(),
});

type ListingFormData = z.infer<typeof listingSchema>;

const availableFeatures = [
  "Klimaanlage",
  "Heizung",
  "Küche",
  "Kühlschrank",
  "Dusche",
  "WC",
  "Solar",
  "Generator",
  "Satellit",
  "WLAN",
  "Fahrradträger",
  "Auffahrrampe",
];

interface ListingFormProps {
  listing?: Listing & { images: Image[] };
}

export function ListingForm({ listing }: ListingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ListingFormData>({
    resolver: zodResolver(listingSchema),
    defaultValues: listing
      ? {
          title: listing.title,
          description: listing.description,
          pricePerDay: listing.pricePerDay,
          seats: listing.seats,
          beds: listing.beds,
          location: listing.location,
          features: listing.features,
          published: listing.published,
        }
      : {
          features: [],
          published: false,
        },
  });

  const selectedFeatures = watch("features");

  const toggleFeature = (feature: string) => {
    const current = selectedFeatures || [];
    if (current.includes(feature)) {
      setValue("features", current.filter((f) => f !== feature));
    } else {
      setValue("features", [...current, feature]);
    }
  };

  const onSubmit = async (data: ListingFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = listing ? `/api/listings/${listing.id}` : "/api/listings";
      const method = listing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard/listings");
      router.refresh();
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{listing ? "Wohnmobil bearbeiten" : "Neues Wohnmobil"}</CardTitle>
        <CardDescription>
          {listing
            ? "Bearbeiten Sie die Details Ihres Wohnmobils"
            : "Fügen Sie ein neues Wohnmobil hinzu"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                placeholder="z.B. Komfortables Wohnmobil für 4 Personen"
                {...register("title")}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Standort *</Label>
              <Input
                id="location"
                placeholder="z.B. München, Bayern"
                {...register("location")}
                disabled={isLoading}
              />
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung *</Label>
            <Textarea
              id="description"
              placeholder="Beschreiben Sie Ihr Wohnmobil..."
              rows={6}
              {...register("description")}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Preis pro Tag (€) *</Label>
              <Input
                id="pricePerDay"
                type="number"
                placeholder="100"
                {...register("pricePerDay")}
                disabled={isLoading}
              />
              {errors.pricePerDay && (
                <p className="text-sm text-destructive">{errors.pricePerDay.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">Sitzplätze *</Label>
              <Input
                id="seats"
                type="number"
                placeholder="4"
                {...register("seats")}
                disabled={isLoading}
              />
              {errors.seats && (
                <p className="text-sm text-destructive">{errors.seats.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="beds">Betten *</Label>
              <Input
                id="beds"
                type="number"
                placeholder="4"
                {...register("beds")}
                disabled={isLoading}
              />
              {errors.beds && (
                <p className="text-sm text-destructive">{errors.beds.message}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Bilder</Label>
            <ImageUpload
              listingId={listing?.id}
              existingImages={listing?.images || []}
            />
            <p className="text-sm text-muted-foreground">
              Laden Sie Bilder Ihres Wohnmobils hoch. Sie können später weitere hinzufügen.
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Ausstattung</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <div key={feature} className="flex items-center space-x-2">
                  <Checkbox
                    id={feature}
                    checked={selectedFeatures?.includes(feature) || false}
                    onCheckedChange={() => toggleFeature(feature)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor={feature}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {feature}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={watch("published")}
              onCheckedChange={(checked) => setValue("published", checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="published" className="cursor-pointer">
              Sofort veröffentlichen
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : listing ? "Aktualisieren" : "Erstellen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

