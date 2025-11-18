"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface PublishListingButtonProps {
  listingId: string;
  published: boolean;
  userRole?: "ADMIN" | "LANDLORD" | "EDITOR";
}

export function PublishListingButton({
  listingId,
  published,
  userRole = "LANDLORD",
}: PublishListingButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // LANDLORDS können nur zurückziehen (DELETE), nicht freigeben (POST)
      // Admins können beides
      const method = published ? "DELETE" : userRole === "ADMIN" ? "POST" : null;
      
      if (!method) {
        throw new Error("Nur Administratoren können Wohnmobile freigeben");
      }

      const response = await fetch(`/api/listings/${listingId}/publish`, {
        method,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Fehler beim Ändern des Status");
      }

      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Button
        variant={published ? "outline" : "default"}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={published ? "text-orange-600 hover:text-orange-700" : ""}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : published ? (
          <XCircle className="h-4 w-4 mr-2" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        {published ? "Zurückziehen" : "Freigeben"}
      </Button>
      {error && (
        <p className="text-xs text-destructive mt-1">{error}</p>
      )}
    </div>
  );
}

