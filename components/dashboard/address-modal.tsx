"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const addressSchema = z.object({
  street: z.string().min(3, "Straße und Hausnummer ist erforderlich"),
  city: z.string().min(2, "Stadt ist erforderlich"),
  postalCode: z.string().min(4, "Postleitzahl ist erforderlich"),
  country: z.string().min(2, "Land ist erforderlich"),
});

type AddressFormData = z.infer<typeof addressSchema>;

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddressModal({ open, onClose }: AddressModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      country: "DE",
    },
  });

  useEffect(() => {
    if (open) {
      setValue("country", "DE");
    }
  }, [open, setValue]);

  const onSubmit = async (data: AddressFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/users/update-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Fehler beim Speichern der Adresse");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload(); // Seite neu laden, um Modal nicht mehr anzuzeigen
      }, 1500);
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Rechnungsadresse erforderlich</DialogTitle>
          <DialogDescription>
            Um einen Plan zu buchen, benötigen wir deine Rechnungsadresse für die Steuerberechnung.
            Bitte gib deine Adresse ein.
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Adresse erfolgreich gespeichert!
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

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

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  "Adresse speichern"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

