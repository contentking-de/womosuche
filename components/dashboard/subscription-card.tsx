"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, AlertCircle, Loader2, RefreshCw, Car, Settings, ArrowUpDown, X, CreditCard } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { getPlanLimit } from "@/lib/plan-limits";

function SyncSubscriptionButton() {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setMessage(null);
    
    try {
      const response = await fetch("/api/stripe/sync-subscription", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Subscription erfolgreich synchronisiert! Bitte Seite neu laden.");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setMessage(data.error || "Fehler beim Synchronisieren");
      }
    } catch (error) {
      setMessage("Fehler beim Synchronisieren");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={syncing}
        className="w-full"
      >
        {syncing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Synchronisiere...
          </>
        ) : (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Mit Stripe synchronisieren
          </>
        )}
      </Button>
      {message && (
        <p className={`text-xs ${message.includes("erfolgreich") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

interface SubscriptionCardProps {
  subscription: {
    stripePriceId: string;
    status: string;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
  } | null;
  currentVehiclesCount?: number;
  showActions?: boolean; // Steuert, ob die Buttons angezeigt werden sollen
}

interface PlanInfo {
  name: string;
  amount: number;
  currency: string;
  interval: string;
}

export function SubscriptionCard({ subscription, currentVehiclesCount = 0, showActions = false }: SubscriptionCardProps) {
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (subscription?.stripePriceId) {
      setLoading(true);
      fetch(`/api/stripe/plan/${subscription.stripePriceId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.plan) {
            setPlanInfo({
              name: data.plan.name,
              amount: data.plan.amount,
              currency: data.plan.currency,
              interval: data.plan.interval,
            });
          }
        })
        .catch((err) => {
          console.error("Error fetching plan:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [subscription?.stripePriceId]);
  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
          <CardDescription>Dein aktuelles Abonnement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kein aktives Abonnement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Bitte wähle einen Plan aus, um Wohnmobile anzulegen.
                </p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <Link href="/dashboard/change-plan" className="block">
                <Button className="w-full">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Abonnement Übersicht
                </Button>
              </Link>
              <SyncSubscriptionButton />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = () => {
    switch (subscription.status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Aktiv
          </Badge>
        );
      case "canceled":
      case "unpaid":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Abgebrochen
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Überfällig
          </Badge>
        );
      case "trialing":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Testphase
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {subscription.status}
          </Badge>
        );
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "Unbekannt";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return "Unbekannt";
    return format(dateObj, "dd.MM.yyyy", { locale: de });
  };

  const formatPrice = (amount: number, currency: string, interval: string) => {
    const currencySymbol = currency.toLowerCase() === "eur" ? "€" : currency.toUpperCase();
    const intervalText = interval === "month" ? "Monat" : interval === "year" ? "Jahr" : interval;
    return `${amount.toFixed(2)} ${currencySymbol}${intervalText !== interval ? ` / ${intervalText}` : ""}`;
  };

  const handleCancelSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (response.ok && data.url) {
        // Öffne Stripe Customer Portal in neuem Tab (für Kündigung)
        window.open(data.url, '_blank', 'noopener,noreferrer');
      } else {
        console.error("Error creating portal session:", data.error);
        alert(data.error || "Fehler beim Öffnen des Verwaltungsportals");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Fehler beim Öffnen des Verwaltungsportals");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleChangePlan = () => {
    // Weiterleitung zur Plan-Auswahl-Seite
    window.location.href = "/dashboard/change-plan";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abonnement</CardTitle>
        <CardDescription>Ihr aktuelles Abonnement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Lade Plan-Informationen...</span>
                </div>
              ) : (
                <>
                  <p className="font-semibold">{planInfo?.name || "Aktueller Plan"}</p>
                  {planInfo && (
                    <p className="text-lg font-bold text-primary mt-1">
                      {formatPrice(planInfo.amount, planInfo.currency, planInfo.interval)}
                    </p>
                  )}
                </>
              )}
            </div>
            {getStatusBadge()}
          </div>

          {/* Fahrzeug-Limit Anzeige */}
          {planInfo && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Fahrzeuge:
                </span>
                <span className="font-medium">
                  {(() => {
                    const limit = getPlanLimit(planInfo.name, planInfo.amount);
                    if (limit.maxVehicles === null) {
                      return `${currentVehiclesCount} / unbegrenzt`;
                    }
                    const isNearLimit = currentVehiclesCount >= limit.maxVehicles * 0.8;
                    const isOverLimit = currentVehiclesCount > limit.maxVehicles;
                    return (
                      <span className={isOverLimit ? "text-red-600" : isNearLimit ? "text-yellow-600" : ""}>
                        {currentVehiclesCount} / {limit.maxVehicles}
                      </span>
                    );
                  })()}
                </span>
              </div>
              {planInfo && (() => {
                const limit = getPlanLimit(planInfo.name, planInfo.amount);
                return (
                  <p className="text-xs text-muted-foreground mt-1">
                    {limit.displayText} im Plan enthalten
                  </p>
                );
              })()}
            </div>
          )}

          {subscription.currentPeriodEnd && (
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Läuft ab am:</span>
                <span className="font-medium">
                  {formatDate(subscription.currentPeriodEnd)}
                </span>
              </div>
            </div>
          )}

          {subscription.cancelAtPeriodEnd && (
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="mr-1 h-4 w-4 inline" />
                Ihr Abonnement wird am {formatDate(subscription.currentPeriodEnd)} gekündigt.
              </p>
            </div>
          )}

          {/* Subscription Buttons - nur anzeigen wenn showActions=true */}
          {showActions && (subscription.status === "active" || subscription.status === "trialing") ? (
            <div className="pt-4 border-t space-y-3">
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="secondary"
                  className="w-auto"
                  onClick={handleChangePlan}
                >
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Plan ändern
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Upgrade oder downgrade dein Abonnement
                </p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="outline"
                  className="w-auto"
                  onClick={handleCancelSubscription}
                  disabled={portalLoading}
                >
                  {portalLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Abonnement kündigen
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Kündige dein Abonnement
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

