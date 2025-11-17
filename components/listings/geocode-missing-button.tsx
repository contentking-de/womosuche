"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";

export function GeocodeMissingButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGeocode = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/listings/geocode-missing", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Fehler beim Geocodieren");
        setIsLoading(false);
        return;
      }

      setMessage(
        `${result.successful} von ${result.processed} Wohnmobilen erfolgreich geocodiert`
      );
      setIsLoading(false);
      
      // Seite neu laden nach 2 Sekunden, um die aktualisierten Daten zu sehen
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage("Fehler beim Geocodieren");
      setIsLoading(false);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span className="text-sm text-muted-foreground">{message}</span>
      )}
      <Button
        onClick={handleGeocode}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird geocodiert...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Fehlende Koordinaten generieren
          </>
        )}
      </Button>
    </div>
  );
}

