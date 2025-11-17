"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const subscriberSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  name: z.string().optional(),
  lists: z.array(z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"])).min(1, "Mindestens eine Liste erforderlich"),
  confirmed: z.boolean().default(false),
}).refine((data) => data.lists.length > 0, {
  message: "Mindestens eine Liste muss ausgewählt werden",
  path: ["lists"],
});

type SubscriberFormData = z.infer<typeof subscriberSchema>;

interface SubscriberFormProps {
  isOpen: boolean;
  onClose: () => void;
  subscriber?: {
    id: string;
    email: string;
    name: string | null;
    lists: ("NEWS" | "REISEBERICHTE" | "VERMIETUNGEN")[];
    confirmed: boolean;
  } | null;
}

export function SubscriberForm({ isOpen, onClose, subscriber }: SubscriberFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SubscriberFormData>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      email: "",
      name: "",
      lists: [],
      confirmed: false,
    },
  });

  // Setze Formularwerte wenn Subscriber bearbeitet wird
  useEffect(() => {
    if (subscriber) {
      reset({
        email: subscriber.email,
        name: subscriber.name || "",
        lists: subscriber.lists,
        confirmed: subscriber.confirmed,
      });
    } else {
      reset({
        email: "",
        name: "",
        lists: [],
        confirmed: false,
      });
    }
    setError(null);
  }, [subscriber, reset]);

  const onSubmit = async (data: SubscriberFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = subscriber
        ? `/api/newsletter/subscribers/${subscriber.id}`
        : "/api/newsletter/subscribers";
      const method = subscriber ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name || null,
          lists: data.lists,
          confirmed: data.confirmed,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Ein Fehler ist aufgetreten");
      }

      router.refresh();
      onClose();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  const watchedLists = watch("lists");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {subscriber ? "Subscriber bearbeiten" : "Neuen Subscriber erstellen"}
          </DialogTitle>
          <DialogDescription>
            {subscriber
              ? "Bearbeiten Sie die Informationen des Subscribers."
              : "Erstellen Sie einen neuen Newsletter-Subscriber."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-Mail-Adresse *</Label>
            <Input
              id="email"
              type="email"
              placeholder="subscriber@example.com"
              {...register("email")}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Max Mustermann"
              {...register("name")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-3">
            <Label>Newsletter-Listen *</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="list-news"
                  checked={watchedLists.includes("NEWS")}
                  onCheckedChange={(checked) => {
                    const currentLists = watchedLists;
                    if (checked) {
                      setValue("lists", [...currentLists, "NEWS"]);
                    } else {
                      setValue("lists", currentLists.filter((l) => l !== "NEWS"));
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="list-news" className="text-sm font-normal cursor-pointer">
                  News & Aktuelles
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="list-reiseberichte"
                  checked={watchedLists.includes("REISEBERICHTE")}
                  onCheckedChange={(checked) => {
                    const currentLists = watchedLists;
                    if (checked) {
                      setValue("lists", [...currentLists, "REISEBERICHTE"]);
                    } else {
                      setValue("lists", currentLists.filter((l) => l !== "REISEBERICHTE"));
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="list-reiseberichte" className="text-sm font-normal cursor-pointer">
                  Reiseberichte
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="list-vermietungen"
                  checked={watchedLists.includes("VERMIETUNGEN")}
                  onCheckedChange={(checked) => {
                    const currentLists = watchedLists;
                    if (checked) {
                      setValue("lists", [...currentLists, "VERMIETUNGEN"]);
                    } else {
                      setValue("lists", currentLists.filter((l) => l !== "VERMIETUNGEN"));
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="list-vermietungen" className="text-sm font-normal cursor-pointer">
                  Vermietungen
                </Label>
              </div>
            </div>
            {errors.lists && (
              <p className="text-sm text-destructive">{errors.lists.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmed"
              checked={watch("confirmed")}
              onCheckedChange={(checked) => setValue("confirmed", checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="confirmed" className="text-sm font-normal cursor-pointer">
              Als bestätigt markieren
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : subscriber ? "Aktualisieren" : "Erstellen"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

