"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

export function NewsletterConfirmationMessage() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");

    if (success === "newsletter-confirmed") {
      setMessage({
        type: "success",
        title: "Newsletter-Anmeldung bestätigt!",
        description:
          "Vielen Dank! Du hast deine Newsletter-Anmeldung erfolgreich bestätigt. Du erhältst ab sofort unsere Newsletter.",
      });
      setIsOpen(true);
    } else if (success === "already-confirmed") {
      setMessage({
        type: "success",
        title: "Bereits bestätigt",
        description:
          "Deine Newsletter-Anmeldung wurde bereits bestätigt. Du erhältst bereits unsere Newsletter.",
      });
      setIsOpen(true);
    } else if (error === "missing-token") {
      setMessage({
        type: "error",
        title: "Bestätigungslink ungültig",
        description:
          "Der Bestätigungslink ist ungültig. Bitte melde dich erneut für den Newsletter an.",
      });
      setIsOpen(true);
    } else if (error === "invalid-token") {
      setMessage({
        type: "error",
        title: "Bestätigungslink ungültig",
        description:
          "Der Bestätigungslink ist ungültig oder wurde bereits verwendet. Bitte melde dich erneut für den Newsletter an.",
      });
      setIsOpen(true);
    } else if (error === "expired-token") {
      setMessage({
        type: "error",
        title: "Bestätigungslink abgelaufen",
        description:
          "Der Bestätigungslink ist abgelaufen (gültig für 7 Tage). Bitte melde dich erneut für den Newsletter an.",
      });
      setIsOpen(true);
    } else if (error === "confirmation-failed") {
      setMessage({
        type: "error",
        title: "Bestätigung fehlgeschlagen",
        description:
          "Die Bestätigung konnte nicht durchgeführt werden. Bitte versuche es später erneut oder melde dich erneut für den Newsletter an.",
      });
      setIsOpen(true);
    }

    // Entferne die Parameter aus der URL nach dem Anzeigen
    if (error || success) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  if (!message) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {message.type === "success" ? (
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            ) : (
              <XCircle className="h-6 w-6 text-red-600" />
            )}
            <DialogTitle
              className={
                message.type === "success" ? "text-green-700" : "text-red-700"
              }
            >
              {message.title}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            {message.description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          {message.type === "error" ? (
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Zur Startseite
              </Button>
            </Link>
          ) : (
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Verstanden
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

