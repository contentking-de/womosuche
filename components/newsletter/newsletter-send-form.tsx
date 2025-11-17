"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";

const newsletterSchema = z.object({
  subject: z.string().min(1, "Betreff ist erforderlich"),
  list: z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"]),
  content: z.string().min(1, "Inhalt ist erforderlich"),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export function NewsletterSendForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      list: undefined,
    },
  });

  const selectedList = watch("list");

  // Lade Empfängeranzahl wenn Liste ausgewählt wird
  const handleListChange = async (list: string) => {
    setValue("list", list as "NEWS" | "REISEBERICHTE" | "VERMIETUNGEN");
    
    try {
      const response = await fetch(`/api/newsletter/recipients?list=${list}`);
      const data = await response.json();
      if (response.ok) {
        setRecipientCount(data.count);
      }
    } catch (err) {
      console.error("Error fetching recipient count:", err);
    }
  };

  const onSubmit = async (data: NewsletterFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/newsletter/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Versenden");
      }

      setSuccess(`Newsletter erfolgreich an ${result.sent} Empfänger versendet`);
      
      // Nach 3 Sekunden zurück zur Übersicht
      setTimeout(() => {
        router.push("/dashboard/newsletter");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Newsletter versenden</CardTitle>
        <CardDescription>
          Versenden Sie einen Newsletter an alle Subscriber einer Liste
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="list">Newsletter-Liste *</Label>
            <Select
              value={watch("list")}
              onValueChange={handleListChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Liste auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEWS">News & Aktuelles</SelectItem>
                <SelectItem value="REISEBERICHTE">Reiseberichte</SelectItem>
                <SelectItem value="VERMIETUNGEN">Vermietungen & Tipps</SelectItem>
              </SelectContent>
            </Select>
            {errors.list && (
              <p className="text-sm text-destructive">{errors.list.message}</p>
            )}
            {recipientCount !== null && (
              <p className="text-sm text-muted-foreground">
                {recipientCount} Empfänger werden den Newsletter erhalten
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Betreff *</Label>
            <Input
              id="subject"
              placeholder="Newsletter Betreff"
              {...register("subject")}
              disabled={isLoading}
            />
            {errors.subject && (
              <p className="text-sm text-destructive">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt (HTML) *</Label>
            <Textarea
              id="content"
              placeholder="Newsletter-Inhalt im HTML-Format"
              rows={15}
              {...register("content")}
              disabled={isLoading}
              className="font-mono text-sm"
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Sie können HTML verwenden. Der Inhalt wird direkt in die E-Mail eingefügt.
            </p>
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isLoading || !selectedList}>
              <Send className="mr-2 h-4 w-4" />
              {isLoading ? "Wird versendet..." : "Newsletter versenden"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

