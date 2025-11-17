"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

const inquirySchema = z.object({
  renterName: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  renterEmail: z.string().email("Ungültige E-Mail-Adresse"),
  renterPhone: z.string().optional(),
  preferredCallTime: z.string().optional(),
  startDate: z.string().min(1, "Reisebeginn ist erforderlich"),
  endDate: z.string().min(1, "Reiseende ist erforderlich"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein"),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Reiseende muss nach Reisebeginn liegen",
  path: ["endDate"],
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormProps {
  listingId: string;
}

export function InquiryForm({ listingId }: InquiryFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
  });

  const startDate = watch("startDate");

  const onSubmit = async (data: InquiryFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          listingId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      reset();
      setIsLoading(false);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-green-800 dark:text-green-200">
            <p className="font-medium">Deine Anfrage wurde erfolgreich gesendet!</p>
            <p className="mt-1 text-sm">
              Der Vermieter wird sich in Kürze bei dir melden.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="renterName">Dein Name *</Label>
              <Input
                id="renterName"
                placeholder="Max Mustermann"
                {...register("renterName")}
                disabled={isLoading}
              />
              {errors.renterName && (
                <p className="text-sm text-destructive">{errors.renterName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="renterEmail">Deine E-Mail *</Label>
              <Input
                id="renterEmail"
                type="email"
                placeholder="deine@email.de"
                {...register("renterEmail")}
                disabled={isLoading}
              />
              {errors.renterEmail && (
                <p className="text-sm text-destructive">{errors.renterEmail.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="renterPhone">Telefonnummer</Label>
              <Input
                id="renterPhone"
                type="tel"
                placeholder="+49 123 456789"
                {...register("renterPhone")}
                disabled={isLoading}
              />
              {errors.renterPhone && (
                <p className="text-sm text-destructive">{errors.renterPhone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferredCallTime">Bevorzugte Rückrufzeit</Label>
              <Input
                id="preferredCallTime"
                type="text"
                placeholder="z.B. 10-12 Uhr oder nachmittags"
                {...register("preferredCallTime")}
                disabled={isLoading}
              />
              {errors.preferredCallTime && (
                <p className="text-sm text-destructive">{errors.preferredCallTime.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Reisebeginn *</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                disabled={isLoading}
                min={new Date().toISOString().split('T')[0]}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Reiseende *</Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                disabled={isLoading}
                min={startDate || new Date().toISOString().split('T')[0]}
              />
              {errors.endDate && (
                <p className="text-sm text-destructive">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Deine Nachricht *</Label>
            <Textarea
              id="message"
              placeholder="Teile uns deine gewünschten Reisedaten und Fragen mit..."
              rows={5}
              {...register("message")}
              disabled={isLoading}
            />
            {errors.message && (
              <p className="text-sm text-destructive">{errors.message.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wird gesendet..." : "Anfrage senden"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

