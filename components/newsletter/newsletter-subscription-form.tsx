"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle2 } from "lucide-react";

const newsletterSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  name: z.string().optional(),
  news: z.boolean().default(false),
  reiseberichte: z.boolean().default(false),
}).refine((data) => data.news || data.reiseberichte, {
  message: "Bitte wähle mindestens eine Liste aus",
  path: ["news"],
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export function NewsletterSubscriptionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      news: false,
      reiseberichte: false,
    },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name || null,
          lists: [
            ...(data.news ? ["NEWS"] : []),
            ...(data.reiseberichte ? ["REISEBERICHTE"] : []),
          ],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten");
      }

      setIsSuccess(true);
      reset();
      
      // Nach 5 Sekunden Success-Message ausblenden
      setTimeout(() => {
        setIsSuccess(false);
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="border-green-200 bg-green-50/80">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <div>
              <p className="font-semibold">Erfolgreich angemeldet!</p>
              <p className="text-sm">Du erhältst in Kürze eine Bestätigungs-E-Mail.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          LASS UNS IN VERBINDUNG BLEIBEN!
        </CardTitle>
        <CardDescription>
          Nie wieder hilfreiche Tipps & Tricks rund um das Wohnmobil und Camping verpassen? Dann abonniere unseren Newsletter und wir halten Dich auf dem Laufenden!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              placeholder="deine@email.de"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Max Mustermann"
              {...register("name")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>Newsletter-Listen *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="news"
                  checked={watch("news")}
                  onCheckedChange={(checked) => setValue("news", checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="news" className="text-sm font-normal cursor-pointer">
                  News & Aktuelles
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reiseberichte"
                  checked={watch("reiseberichte")}
                  onCheckedChange={(checked) => setValue("reiseberichte", checked === true)}
                  disabled={isLoading}
                />
                <Label htmlFor="reiseberichte" className="text-sm font-normal cursor-pointer">
                  Reiseberichte
                </Label>
              </div>
            </div>
            {errors.news && (
              <p className="text-sm text-destructive">{errors.news.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? "Wird abonniert..." : "Newsletter abonnieren"}
          </Button>

          <p className="text-xs text-muted-foreground">
            Mit der Anmeldung stimmst du unserer Datenschutzerklärung zu. Du kannst dich jederzeit wieder abmelden.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

