"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlossaryTerm } from "@prisma/client";
import { generateSlug } from "@/lib/slug";

const termSchema = z.object({
  term: z.string().min(2, "Begriff muss mindestens 2 Zeichen lang sein"),
  slug: z.string().min(2, "Slug muss mindestens 2 Zeichen lang sein"),
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein"),
});

type TermFormData = z.infer<typeof termSchema>;

interface GlossaryTermFormProps {
  term?: GlossaryTerm;
}

export function GlossaryTermForm({ term }: GlossaryTermFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TermFormData>({
    resolver: zodResolver(termSchema),
    defaultValues: term
      ? {
          term: term.term,
          slug: term.slug,
          content: term.content,
        }
      : {
          term: "",
          slug: "",
          content: "",
        },
  });

  const termValue = watch("term");

  // Auto-generate slug when term changes
  const handleTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = e.target.value;
    setValue("term", newTerm);
    if (!term) {
      // Only auto-generate for new terms
      setValue("slug", generateSlug(newTerm));
    }
  };

  const onSubmit = async (data: TermFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = term ? `/api/lexikon/${term.id}` : "/api/lexikon";
      const method = term ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard/lexikon");
      router.refresh();
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{term ? "Begriff bearbeiten" : "Neuer Begriff"}</CardTitle>
        <CardDescription>
          {term
            ? "Bearbeiten Sie den Fachbegriff"
            : "Fügen Sie einen neuen Fachbegriff hinzu"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="term">Begriff *</Label>
            <Input
              id="term"
              placeholder="z.B. Wohnmobil"
              {...register("term")}
              onChange={handleTermChange}
              disabled={isLoading}
            />
            {errors.term && (
              <p className="text-sm text-destructive">{errors.term.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="z.B. wohnmobil"
              {...register("slug")}
              disabled={isLoading}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              URL-freundlicher Name für den Begriff
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt *</Label>
            <Textarea
              id="content"
              placeholder="Erklären Sie den Begriff..."
              rows={10}
              {...register("content")}
              disabled={isLoading}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              Sie können Markdown verwenden
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : term ? "Aktualisieren" : "Erstellen"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Abbrechen
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

