"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Loader2, CheckCircle2, Mail } from "lucide-react";

const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string(),
  street: z.string().min(3, "Straße und Hausnummer ist erforderlich"),
  city: z.string().min(2, "Stadt ist erforderlich"),
  postalCode: z.string().min(4, "Postleitzahl ist erforderlich"),
  country: z.string().min(2, "Land ist erforderlich"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          street: data.street,
          city: data.city,
          postalCode: data.postalCode,
          country: data.country || "DE",
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerResult.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      // Erfolg: Zeige Erfolgsmeldung
      setSuccess(true);
      setUserEmail(data.email);
      setIsLoading(false);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrieren</CardTitle>
        <CardDescription>
          Erstellen Sie ein Konto, um Wohnmobile zu vermieten
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-6 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                Registrierung erfolgreich!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300 mb-4">
                Wir haben eine Bestätigungs-E-Mail an <strong>{userEmail}</strong> gesendet.
              </p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Nächste Schritte:
                    </p>
                    <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                      <li>Öffne dein E-Mail-Postfach</li>
                      <li>Klicke auf den Bestätigungslink in der E-Mail</li>
                      <li>Melde dich dann mit deinen Zugangsdaten an</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center">
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Zur Anmeldung
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Max Mustermann"
              {...register("name")}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="ihre@email.de"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register("confirmPassword")}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Adressfelder */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-semibold">Rechnungsadresse</h3>
            
            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer *</Label>
              <Input
                id="street"
                type="text"
                placeholder="Musterstraße 123"
                {...register("street")}
                disabled={isLoading}
              />
              {errors.street && (
                <p className="text-sm text-destructive">{errors.street.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postleitzahl *</Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="12345"
                  {...register("postalCode")}
                  disabled={isLoading}
                />
                {errors.postalCode && (
                  <p className="text-sm text-destructive">{errors.postalCode.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Stadt *</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Berlin"
                  {...register("city")}
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">{errors.city.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Land *</Label>
              <Input
                id="country"
                type="text"
                placeholder="DE"
                {...register("country", { value: "DE" })}
                disabled={isLoading}
              />
              {errors.country && (
                <p className="text-sm text-destructive">{errors.country.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird registriert...
              </>
            ) : (
              "Registrieren"
            )}
          </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">Bereits ein Konto? </span>
              <Link href="/login" className="text-primary hover:underline">
                Anmelden
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

