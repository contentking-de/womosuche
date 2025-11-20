"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ callbackUrl, passwordReset }: { callbackUrl?: string; passwordReset?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // Prüfe ob es eine spezifische Fehlermeldung gibt
        let errorMessage = "Ungültige Anmeldedaten";
        
        // Prüfe verschiedene Fehlercodes
        if (result.error === "EMAIL_NOT_VERIFIED" || result.error.includes("EMAIL_NOT_VERIFIED")) {
          errorMessage = "Du musst zuerst den Bestätigungslink in der Mail anklicken, bevor du dich einloggen kannst.";
        } else if (result.error === "Configuration") {
          // Configuration Error kann auch bedeuten, dass E-Mail nicht verifiziert ist
          // Prüfe zusätzlich, ob die E-Mail verifiziert ist
          try {
            const checkResponse = await fetch("/api/auth/check-email-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: data.email }),
            });
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              if (!checkData.verified) {
                errorMessage = "Du musst zuerst den Bestätigungslink in der Mail anklicken, bevor du dich einloggen kannst.";
              } else {
                // E-Mail ist verifiziert, aber Login schlägt trotzdem fehl
                errorMessage = "Ungültige Anmeldedaten";
              }
            } else {
              // Bei Fehler der Prüfung, zeige die Standard-Fehlermeldung
              errorMessage = "Du musst zuerst den Bestätigungslink in der Mail anklicken, bevor du dich einloggen kannst.";
            }
          } catch (checkError) {
            // Bei Fehler der Prüfung, zeige die Standard-Fehlermeldung
            errorMessage = "Du musst zuerst den Bestätigungslink in der Mail anklicken, bevor du dich einloggen kannst.";
          }
        } else if (result.error !== "CredentialsSignin" && result.error !== "Configuration") {
          errorMessage = result.error;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Entferne alle Query-Parameter außer callbackUrl
      const targetUrl = callbackUrl || searchParams.get("callbackUrl") || "/dashboard";
      // Verwende replace, um die Login-URL aus der History zu entfernen
      router.replace(targetUrl);
      router.refresh();
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anmelden</CardTitle>
        <CardDescription>
          Geben Sie Ihre Anmeldedaten ein, um fortzufahren
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {passwordReset && (
            <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-800 dark:text-green-200">
              Ihr Passwort wurde erfolgreich zurückgesetzt. Sie können sich jetzt mit Ihrem neuen Passwort anmelden.
            </div>
          )}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passwort</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Passwort vergessen?
              </Link>
            </div>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wird angemeldet..." : "Anmelden"}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">Noch kein Konto? </span>
            <Link href="/register" className="text-primary hover:underline">
              Registrieren
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

