"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, Loader2 } from "lucide-react";

export function RefreshSubscription() {
  const router = useRouter();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    // Synchronisiere zuerst mit Stripe, dann lade die Seite neu
    const syncAndRefresh = async () => {
      try {
        // Synchronisiere mit Stripe
        const response = await fetch("/api/stripe/sync-subscription", {
          method: "POST",
        });
        
        const data = await response.json();
        console.log("Sync result:", data);
        
        // Warte kurz, damit die Datenbank aktualisiert wird
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Lade die Seite neu
        router.refresh();
        setSyncing(false);
      } catch (error) {
        console.error("Error syncing subscription:", error);
        // Lade die Seite trotzdem neu
        router.refresh();
        setSyncing(false);
      }
    };

    syncAndRefresh();
  }, [router]);

  return (
    <Alert className="mb-4 border-green-200 bg-green-50">
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <AlertTitle className="text-green-800">Plan erfolgreich geändert!</AlertTitle>
      <AlertDescription className="text-green-700">
        {syncing ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Synchronisiere mit Stripe...
          </span>
        ) : (
          "Dein Abonnement wurde aktualisiert."
        )}
      </AlertDescription>
    </Alert>
  );
}

