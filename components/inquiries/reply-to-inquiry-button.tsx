"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { Inquiry } from "@prisma/client";

interface ReplyToInquiryButtonProps {
  inquiry: Inquiry & {
    Listing: { id: string; title: string; slug: string };
    renterName: string;
    renterEmail: string;
  };
  ownerName: string;
}

const REPLY_TEMPLATES = {
  rejected: (ownerName: string) => `Es tut uns leid, aber das angefragte Fahrzeug ist für den gewünschten Zeitraum nicht mehr verfügbar. Wir bedanken uns trotzdem für die Anfrage und wünschen viel Erfolg bei Suche nach einem geeigneten Mietfahrzeug und erholsamen Urlaub.

Mit besten Grüßen

das Team von ${ownerName}`,

  confirmed: (ownerName: string) => `Vielen Dank für Deine Anfrage. Hiermit bestätigen wir Dir, dass das Fahrzeug im gewünschten Zeitraum verfügbar wäre. Unsere Vermietung meldet sich mit Details zum weiteren Vorgehen und den Buchungsunterlagen bei Dir. Bis dahin bleibt diese Zusage unverbindlich und gilt nicht als Reservierungsbestätigung. In der Regel melden wir uns binnen 24h bei Dir.

Mit besten Grüßen

das Team von ${ownerName}`,

  upsell: (ownerName: string) => `Danke für Deine Anfrage. Leider ist das Fahrzeug nicht mehr verfügbar, aber wir haben eine Alternative für Dich gefunden in unserem Fuhrpark. Unsere Kollegen melden sich in den nächsten 24h bei Dir, damit wir besprechen können, ob das Fahrzeug für Dich in Frage käme.

Mit besten Grüßen

das Team von ${ownerName}`,
};

export function ReplyToInquiryButton({ inquiry, ownerName }: ReplyToInquiryButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    if (templateKey && templateKey in REPLY_TEMPLATES) {
      const template = REPLY_TEMPLATES[templateKey as keyof typeof REPLY_TEMPLATES];
      setMessage(template(ownerName));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setErrorMessage("Bitte geben Sie eine Nachricht ein.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/inquiries/${inquiry.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message.trim(),
          template: selectedTemplate || undefined,
        }),
      });

      const responseData = await response.json().catch(() => null);
      
      if (!response.ok) {
        let errorMsg = "Fehler beim Senden der Antwort";
        if (responseData) {
          errorMsg = responseData.error || errorMsg;
          if (responseData.details) {
            console.error("Fehlerdetails:", responseData.details);
          }
        } else {
          errorMsg = `HTTP ${response.status}: ${response.statusText}`;
        }
        console.error("API Error:", errorMsg, responseData);
        setIsSubmitting(false);
        setErrorMessage(errorMsg);
        return; // Nicht schließen bei Fehler
      }

      // Erfolgreich
      console.log("Antwort erfolgreich gesendet:", responseData);
      setSuccessMessage("Ihre Antwort wurde erfolgreich gesendet!");
      setIsSubmitting(false);
      
      // Nach 2 Sekunden Modal schließen und Seite aktualisieren
      setTimeout(() => {
        setOpen(false);
        setMessage("");
        setSelectedTemplate("");
        setSuccessMessage("");
        setErrorMessage("");
        router.refresh();
      }, 2000);
    } catch (error) {
      console.error("Error sending reply:", error);
      setIsSubmitting(false);
      const errorMsg = error instanceof Error ? error.message : "Es gab einen Fehler beim Senden Ihrer Antwort. Bitte versuchen Sie es später erneut.";
      setErrorMessage(errorMsg);
      // Modal bleibt offen bei Fehler
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Antworten
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Antwort an {inquiry.renterName}</DialogTitle>
          <DialogDescription>
            Senden Sie eine Antwort an {inquiry.renterEmail} bezüglich der Anfrage für "{inquiry.Listing.title}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {successMessage && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
          <div>
            <Label htmlFor="template">Vorlage auswählen (optional)</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange} disabled={isSubmitting || !!successMessage}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Vorlage auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="upsell">Upsell/Alternative</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="message">Ihre Nachricht *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={8}
              className="mt-2"
              placeholder="Schreiben Sie hier Ihre Antwort an den Mieter oder wählen Sie eine Vorlage aus..."
              disabled={isSubmitting || !!successMessage}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setMessage("");
                setSelectedTemplate("");
                setSuccessMessage("");
                setErrorMessage("");
              }}
              disabled={isSubmitting}
            >
              {successMessage ? "Schließen" : "Abbrechen"}
            </Button>
            {!successMessage && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Wird gesendet..." : "Antwort senden"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

