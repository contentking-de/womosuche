"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface StripePlan {
  id: string;
  name: string;
  description: string | null;
  priceId: string;
  amount: number;
  currency: string;
  interval: string;
}

export default function ChangePlanPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<StripePlan[]>([]);
  const [currentPlanPriceId, setCurrentPlanPriceId] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Hole verfügbare Pläne
        const plansResponse = await fetch("/api/stripe/plans");
        const plansData = await plansResponse.json();
        if (plansResponse.ok && plansData.plans) {
          setPlans(plansData.plans);
        }

        // Hole aktuelle Subscription
        const subscriptionResponse = await fetch("/api/stripe/current-subscription");
        if (subscriptionResponse.ok) {
          const subscriptionData = await subscriptionResponse.json();
          if (subscriptionData.subscription) {
            setCurrentPlanPriceId(subscriptionData.subscription.stripePriceId);
            setSelectedPriceId(subscriptionData.subscription.stripePriceId);
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChangePlan = async () => {
    if (!selectedPriceId) {
      setError("Bitte wähle einen Plan aus");
      return;
    }
    
    if (selectedPriceId === currentPlanPriceId) {
      setError("Dieser Plan ist bereits aktiv");
      return;
    }

    setChanging(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: selectedPriceId }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Weiterleitung zu Checkout Session für Zahlungsbestätigung
        window.location.href = data.url;
      } else {
        setError(data.error || "Fehler beim Auswählen des Plans");
        setChanging(false);
      }
    } catch (err) {
      setError("Fehler beim Auswählen des Plans");
      setChanging(false);
    }
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const currencySymbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
    const intervalText = interval === "month" ? "Monat" : interval === "year" ? "Jahr" : interval;
    return `${amount.toFixed(2)} ${currencySymbol}${intervalText !== interval ? ` / ${intervalText}` : ""}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/settings">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Einstellungen
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">
          {currentPlanPriceId ? "Plan ändern" : "Plan auswählen"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {currentPlanPriceId 
            ? "Wähle einen neuen Plan für dein Abonnement"
            : "Wähle einen Plan für dein Abonnement"}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <RadioGroup value={selectedPriceId || ""} onValueChange={setSelectedPriceId}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const isCurrentPlan = plan.priceId === currentPlanPriceId;
            const isSelected = plan.priceId === selectedPriceId;

            return (
              <Label
                key={plan.priceId}
                htmlFor={plan.priceId}
                className={cn(
                  "cursor-pointer",
                  isCurrentPlan && "opacity-60"
                )}
              >
                <Card
                  className={cn(
                    "transition-all",
                    isSelected && "ring-2 ring-primary",
                    isCurrentPlan && "bg-muted"
                  )}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isCurrentPlan && (
                        <Badge variant="secondary" className="text-xs">
                          Aktuell
                        </Badge>
                      )}
                    </div>
                    {plan.description && (
                      <CardDescription>{plan.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-2xl font-bold">
                          {formatPrice(plan.amount, plan.currency, plan.interval)}
                        </p>
                      </div>
                      <RadioGroupItem
                        value={plan.priceId}
                        id={plan.priceId}
                        className="sr-only"
                        disabled={isCurrentPlan}
                      />
                    </div>
                  </CardContent>
                </Card>
              </Label>
            );
          })}
        </div>
      </RadioGroup>

      <div className="mt-8 flex items-center justify-between">
        <Link href="/dashboard/settings">
          <Button variant="outline">Abbrechen</Button>
        </Link>
        <Button
          onClick={handleChangePlan}
          disabled={changing || !selectedPriceId || selectedPriceId === currentPlanPriceId}
        >
          {changing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Wird geladen...
            </>
          ) : currentPlanPriceId ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Plan ändern
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Plan auswählen
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

