"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewListingButtonProps {
  userId: string;
  userRole: "ADMIN" | "LANDLORD" | "EDITOR";
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewListingButton({ 
  userId, 
  userRole, 
  className = "",
  variant = "default",
  size = "default"
}: NewListingButtonProps) {
  const [limitCheck, setLimitCheck] = useState<{
    canCreate: boolean;
    reason?: string;
    currentCount: number;
    maxCount: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userRole !== "LANDLORD") {
      setLoading(false);
      return;
    }

    // Prüfe Limit
    fetch(`/api/listings/check-limit?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        setLimitCheck(data);
      })
      .catch((err) => {
        console.error("Error checking limit:", err);
        // Bei Fehler erlauben wir das Anlegen NICHT (Fail-Closed für Sicherheit)
        setLimitCheck({ 
          canCreate: false, 
          currentCount: 0, 
          maxCount: null,
          reason: "Fehler beim Prüfen des Limits. Bitte versuche es erneut oder kontaktiere den Support."
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId, userRole]);

  if (userRole === "ADMIN" || userRole === "EDITOR") {
    return (
      <Link href="/dashboard/listings/new">
        <Button className={className} variant={variant} size={size}>
          <Plus className="mr-2 h-4 w-4" />
          Neues Wohnmobil
        </Button>
      </Link>
    );
  }

  if (loading) {
    return (
      <Button className={className} variant={variant} size={size} disabled>
        <Plus className="mr-2 h-4 w-4" />
        Lade...
      </Button>
    );
  }

  // Wenn limitCheck null ist (Fehler oder noch nicht geladen), Button deaktivieren
  if (!limitCheck) {
    return (
      <div className="space-y-2">
        <Button className={className} variant={variant} size={size} disabled>
          <Plus className="mr-2 h-4 w-4" />
          Neues Wohnmobil
        </Button>
        <Link href="/dashboard/change-plan" className="block">
          <Button variant="secondary" className="w-full" size={size}>
            Plan auswählen
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground text-center mt-1">
          Bitte wähle zuerst einen Plan aus.
        </p>
      </div>
    );
  }

  if (!limitCheck.canCreate) {
    return (
      <div className="space-y-2">
        <Button className={className} variant={variant} size={size} disabled>
          <Plus className="mr-2 h-4 w-4" />
          Neues Wohnmobil
        </Button>
        <Link href="/dashboard/change-plan" className="block">
          <Button variant="secondary" className="w-full" size={size}>
            Jetzt upgraden
          </Button>
        </Link>
        {limitCheck.reason && (
          <p className="text-xs text-muted-foreground text-center mt-1">
            {limitCheck.reason}
          </p>
        )}
      </div>
    );
  }

  return (
    <Link href="/dashboard/listings/new">
      <Button className={className} variant={variant} size={size}>
        <Plus className="mr-2 h-4 w-4" />
        Neues Wohnmobil
      </Button>
    </Link>
  );
}

