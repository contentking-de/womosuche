"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const parkingSubmissionSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  location: z.string().min(3, "Standort muss mindestens 3 Zeichen lang sein"),
  postalCode: z.string().regex(/^\d{5}$/, "Postleitzahl muss 5 Ziffern haben"),
  description: z.string().min(10, "Beschreibung muss mindestens 10 Zeichen lang sein"),
  submitterName: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  submitterEmail: z.string().email("Ungültige E-Mail-Adresse"),
  submitterPhone: z.string().optional(),
});

type ParkingSubmissionData = z.infer<typeof parkingSubmissionSchema>;

export function SubmitParkingForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ParkingSubmissionData>({
    resolver: zodResolver(parkingSubmissionSchema),
  });

  const onSubmit = async (data: ParkingSubmissionData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/abstellplaetze/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      reset();
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 2000);
      setIsLoading(false);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Abstellplatz einreichen</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Abstellplatz einreichen</DialogTitle>
          <DialogDescription>
            Teile uns einen neuen Abstellplatz mit, den wir in unsere Übersicht aufnehmen können.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-200">
            <p className="font-medium">Vielen Dank für deine Einreichung!</p>
            <p className="mt-1 text-sm">
              Wir werden deinen Abstellplatz prüfen und bei Genehmigung in unsere Übersicht aufnehmen.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Name des Abstellplatzes *</Label>
              <Input
                id="title"
                placeholder="z.B. Wohnmobil Abstellplatz Doberlug-Kirchhain"
                {...register("title")}
                disabled={isLoading}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postleitzahl *</Label>
                <Input
                  id="postalCode"
                  placeholder="z.B. 03253"
                  maxLength={5}
                  {...register("postalCode")}
                  disabled={isLoading}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Standort/Adresse *</Label>
                <Input
                  id="location"
                  placeholder="z.B. Doberlug-Kirchhain, Brandenburg"
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
                placeholder="Beschreibe den Abstellplatz, z.B. Lage, Ausstattung, Preise, Öffnungszeiten..."
                rows={4}
                {...register("description")}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Deine Kontaktdaten</Label>
              <p className="text-sm text-muted-foreground">
                Diese Daten werden nur für Rückfragen verwendet und nicht veröffentlicht.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="submitterName">Dein Name *</Label>
                <Input
                  id="submitterName"
                  placeholder="Max Mustermann"
                  {...register("submitterName")}
                  disabled={isLoading}
                />
                {errors.submitterName && (
                  <p className="text-sm text-destructive">{errors.submitterName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="submitterEmail">Deine E-Mail *</Label>
                <Input
                  id="submitterEmail"
                  type="email"
                  placeholder="deine@email.de"
                  {...register("submitterEmail")}
                  disabled={isLoading}
                />
                {errors.submitterEmail && (
                  <p className="text-sm text-destructive">{errors.submitterEmail.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterPhone">Telefonnummer (optional)</Label>
              <Input
                id="submitterPhone"
                type="tel"
                placeholder="+49 123 456789"
                {...register("submitterPhone")}
                disabled={isLoading}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  reset();
                  setError(null);
                }}
                disabled={isLoading}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Wird gesendet..." : "Einreichen"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

