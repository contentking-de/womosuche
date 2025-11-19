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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Listing, Image, User } from "@prisma/client";
import { ImageUpload } from "./image-upload";
import { Separator } from "@/components/ui/separator";
import { availableBrands } from "@/lib/brands";
import { EquipmentForm } from "./equipment-form";
import type { EquipmentData } from "@/lib/equipment-schema";

const equipmentSchema = z.object({
  // Allgemeine Fahrzeugdaten
  vehicleType: z.string().optional(),
  year: z.number().optional(),
  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  totalWeight: z.string().optional(),
  seats: z.number().optional(),
  sleepPlaces: z.number().optional(),
  enginePower: z.string().optional(),
  transmission: z.string().optional(),
  fuelType: z.string().optional(),
  fuelConsumption: z.string().optional(),
  reversingCamera: z.boolean().optional(),
  // Schlafen
  bedTypes: z.array(z.string()).optional(),
  bedSizes: z.array(z.string()).optional(),
  bedComfort: z.array(z.string()).optional(),
  bedConversion: z.boolean().optional(),
  // Küche
  stove: z.string().optional(),
  refrigerator: z.string().optional(),
  sink: z.boolean().optional(),
  oven: z.boolean().optional(),
  microwave: z.boolean().optional(),
  gasSupply: z.string().optional(),
  kitchenware: z.boolean().optional(),
  // Bad
  shower: z.boolean().optional(),
  toilet: z.string().optional(),
  washbasin: z.boolean().optional(),
  hotWater: z.boolean().optional(),
  separateShower: z.boolean().optional(),
  // Technik & Energie
  freshWaterTank: z.number().optional(),
  wasteWaterTank: z.number().optional(),
  heating: z.string().optional(),
  airConditioning: z.string().optional(),
  solarPower: z.number().optional(),
  inverter: z.boolean().optional(),
  shorePower: z.boolean().optional(),
  shorePowerCable: z.boolean().optional(),
  additionalBatteries: z.boolean().optional(),
  // Innenraum & Komfort
  seating: z.string().optional(),
  swivelSeats: z.boolean().optional(),
  tv: z.boolean().optional(),
  satellite: z.boolean().optional(),
  usbPorts: z.boolean().optional(),
  blinds: z.boolean().optional(),
  flyScreen: z.boolean().optional(),
  floorHeating: z.boolean().optional(),
  storage: z.array(z.string()).optional(),
  // Außen & Campingzubehör
  awning: z.boolean().optional(),
  bikeRack: z.string().optional(),
  towbar: z.boolean().optional(),
  campingFurniture: z.boolean().optional(),
  levelingBlocks: z.boolean().optional(),
  outdoorSocket: z.boolean().optional(),
  outdoorShower: z.boolean().optional(),
}).optional();

const listingSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  pricePerDay: z.number().min(1, "Preis muss größer als 0 sein"),
  seats: z.number().min(1, "Mindestens 1 Sitzplatz erforderlich"),
  beds: z.number().min(1, "Mindestens 1 Bett erforderlich"),
  location: z.string()
    .min(2, "Standort ist erforderlich")
    .refine(
      (val) => !val.includes("(") && !val.includes(")") && !val.includes("/"),
      {
        message: "Standort darf keine Klammern ( ) oder Schrägstriche (/) enthalten",
      }
    ),
  features: z.array(z.string()),
  marke: z.string().optional(),
  equipment: equipmentSchema,
  published: z.boolean(),
  ownerId: z.string().optional(),
});

export type ListingFormData = z.infer<typeof listingSchema>;

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
  userRole?: "ADMIN" | "LANDLORD" | "EDITOR";
  ownerId?: string;
  availableUsers?: User[];
}

export function ListingForm({ listing, userRole, ownerId: initialOwnerId, availableUsers = [] }: ListingFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showSpecialCharWarning, setShowSpecialCharWarning] = useState(false);

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
          marke: (listing as any).marke || "",
          equipment: (listing as any).equipment || undefined,
          published: listing.published,
          ownerId: listing.ownerId,
        }
      : {
          features: [],
          equipment: undefined,
          published: userRole === "ADMIN" ? false : false, // LANDLORDs können nicht veröffentlichen
          ownerId: initialOwnerId,
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

  const handleAiGenerate = async () => {
    setAiError(null);
    const title = watch("title")?.trim() || "";
    if (title.length < 3) {
      setAiError("Bitte geben Sie zuerst einen Titel ein.");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          __action: "generate",
          title: watch("title"),
          location: watch("location"),
          pricePerDay: watch("pricePerDay"),
          seats: watch("seats"),
          beds: watch("beds"),
          features: watch("features") || [],
          marke: watch("marke"),
          equipment: watch("equipment"),
          existingDescription: watch("description"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "KI-Vorschlag fehlgeschlagen");
      }
      if (typeof data?.description === "string") {
        setValue("description", data.description);
      }
    } catch (e) {
      setAiError((e as Error).message);
    } finally {
      setAiLoading(false);
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
                {...register("location", {
                  onChange: (e) => {
                    // Prüfe ob Sonderzeichen eingegeben wurden
                    const hasSpecialChars = /[()/]/.test(e.target.value);
                    if (hasSpecialChars) {
                      setShowSpecialCharWarning(true);
                      // Entferne Klammern und Schrägstriche beim Tippen
                      const value = e.target.value.replace(/[()/]/g, "");
                      e.target.value = value;
                      setValue("location", value);
                    } else {
                      setShowSpecialCharWarning(false);
                    }
                  },
                })}
                disabled={isLoading}
              />
              {showSpecialCharWarning && (
                <p className="text-sm text-destructive">
                  Sonderzeichen wie Klammern ( ) und Schrägstriche (/) sind nicht erlaubt
                </p>
              )}
              {errors.location && (
                <p className="text-sm text-destructive">{errors.location.message}</p>
              )}
            </div>
          </div>

          {userRole === "ADMIN" && availableUsers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="ownerId">Vermieter *</Label>
              <Select
                defaultValue={watch("ownerId") || ""}
                onValueChange={(value) => setValue("ownerId", value)}
                disabled={isLoading}
              >
                <SelectTrigger id="ownerId">
                  <SelectValue placeholder="Vermieter auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email} {user.name && `(${user.email})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ownerId && (
                <p className="text-sm text-destructive">{errors.ownerId.message}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="description">Beschreibung *</Label>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={handleAiGenerate} 
                disabled={isLoading || aiLoading}
                size="sm"
              >
                {aiLoading ? "KI arbeitet..." : "Mit KI generieren"}
              </Button>
            </div>
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
            {aiError && (
              <p className="text-sm text-destructive">{aiError}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Die KI kann eine Beschreibung basierend auf den eingegebenen Daten generieren oder die vorhandene Beschreibung überarbeiten.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="marke">Marke</Label>
              <Select
                value={watch("marke") || "__none__"}
                onValueChange={(value) => setValue("marke", value === "__none__" ? undefined : value)}
                disabled={isLoading}
              >
                <SelectTrigger id="marke">
                  <SelectValue placeholder="Marke auswählen (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Keine Marke</SelectItem>
                  {availableBrands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="pricePerDay">Preis pro Tag (€) *</Label>
              <Input
                id="pricePerDay"
                type="number"
                placeholder="100"
                {...register("pricePerDay", { valueAsNumber: true })}
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
                {...register("seats", { valueAsNumber: true })}
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
                {...register("beds", { valueAsNumber: true })}
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
            <Label>Ausstattung (Basis)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Wichtige Ausstattungsmerkmale für die Schnellsuche
            </p>
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

          <Separator />

          <div className="space-y-4">
            <div>
              <Label className="text-lg font-semibold">Detaillierte Ausstattung</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Erfasse alle technischen Details und Ausstattungsmerkmale deines Wohnmobils
              </p>
            </div>
            <EquipmentForm form={{ watch, setValue, formState: { errors } } as any} disabled={isLoading} />
          </div>

          {userRole === "ADMIN" && (
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
          )}
          {userRole !== "ADMIN" && (
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
              <p>
                <strong>Hinweis:</strong> Dein Wohnmobil wird als Entwurf gespeichert und muss von einem Administrator geprüft und freigegeben werden, bevor es veröffentlicht wird.
              </p>
            </div>
          )}

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

