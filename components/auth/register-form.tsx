"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const registerSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein"),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  confirmPassword: z.string(),
  priceId: z.string().min(1, "Bitte wählen Sie einen Plan aus"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwörter stimmen nicht überein",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface StripePlan {
  id: string;
  name: string;
  description: string | null;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedPriceId = watch("priceId");

  // Lade Stripe-Pläne beim Mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch("/api/stripe/plans");
        const data = await response.json();
        if (response.ok && data.plans) {
          setPlans(data.plans);
          // Wähle automatisch den ersten Plan aus
          if (data.plans.length > 0) {
            setValue("priceId", data.plans[0].priceId);
          }
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError("Fehler beim Laden der Pläne. Bitte laden Sie die Seite neu.");
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      // Schritt 1: User registrieren
      const registerResponse = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const registerResult = await registerResponse.json();

      if (!registerResponse.ok) {
        setError(registerResult.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      // Schritt 2: Stripe Checkout Session erstellen
      const checkoutResponse = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: data.priceId,
          userId: registerResult.userId,
        }),
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResponse.ok) {
        setError(checkoutResult.error || "Fehler beim Erstellen der Checkout-Session");
        setIsLoading(false);
        return;
      }

      // Schritt 3: Weiterleitung zu Stripe Checkout
      if (checkoutResult.url) {
        window.location.href = checkoutResult.url;
      } else {
        setError("Keine Checkout-URL erhalten");
        setIsLoading(false);
      }
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
            <div className="rounded-md bg-green-50 border border-green-200 p-4">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Registrierung erfolgreich!
              </h3>
              <p className="text-sm text-green-800 mb-4">
                Wir haben dir eine Bestätigungsmail an <strong>{userEmail}</strong> gesendet.
              </p>
              <p className="text-sm text-green-800 mb-4">
                Bitte öffne dein E-Mail-Postfach und klicke auf den Bestätigungslink, um dein Konto zu aktivieren.
              </p>
              <p className="text-sm text-green-800">
                Nach der Bestätigung kannst du dich mit deinen Zugangsdaten anmelden.
              </p>
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

          {/* Subscription Plan Auswahl */}
          <div className="space-y-3">
            <Label>Abonnement-Plan *</Label>
            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Pläne werden geladen...</span>
              </div>
            ) : plans.length === 0 ? (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                Keine Pläne verfügbar. Bitte kontaktieren Sie den Support.
              </div>
            ) : (
              <RadioGroup
                value={selectedPriceId}
                onValueChange={(value) => setValue("priceId", value)}
                disabled={isLoading}
                className="space-y-3"
              >
                {plans.map((plan) => (
                  <div
                    key={plan.priceId}
                    className={cn(
                      "relative flex items-start space-x-3 rounded-lg border p-4 transition-colors",
                      selectedPriceId === plan.priceId
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    <RadioGroupItem
                      value={plan.priceId}
                      id={plan.priceId}
                      className="mt-1"
                    />
                    <Label
                      htmlFor={plan.priceId}
                      className="flex-1 cursor-pointer space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{plan.name}</span>
                        <span className="text-lg font-bold">
                          {plan.amount.toFixed(2)} €
                          <span className="text-sm font-normal text-muted-foreground">
                            /{plan.interval === "month" ? "Monat" : "Jahr"}
                          </span>
                        </span>
                      </div>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground">
                          {plan.description}
                        </p>
                      )}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {errors.priceId && (
              <p className="text-sm text-destructive">{errors.priceId.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || loadingPlans || plans.length === 0}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wird registriert...
              </>
            ) : (
              "Registrieren und zur Zahlung"
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

