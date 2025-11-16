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
import { Checkbox } from "@/components/ui/checkbox";
import { Article } from "@prisma/client";
import { generateSlug } from "@/lib/slug";

const articleSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  slug: z.string().min(2, "Slug muss mindestens 2 Zeichen lang sein"),
  excerpt: z.string().optional(),
  content: z.string().min(10, "Inhalt muss mindestens 10 Zeichen lang sein"),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

type ArticleFormData = z.infer<typeof articleSchema>;

interface ArticleFormProps {
  article?: Article;
}

export function ArticleForm({ article }: ArticleFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ArticleFormData>({
    resolver: zodResolver(articleSchema),
    defaultValues: article
      ? {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || "",
          content: article.content,
          tags: article.tags,
          published: article.published,
        }
      : {
          tags: [],
          published: false,
        },
  });

  const tags = watch("tags") || [];
  const titleValue = watch("title");

  // Auto-generate slug when title changes
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setValue("title", newTitle);
    if (!article) {
      // Only auto-generate for new articles
      setValue("slug", generateSlug(newTitle));
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setValue("tags", [...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const onSubmit = async (data: ArticleFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = article ? `/api/magazin/${article.id}` : "/api/magazin";
      const method = article ? "PUT" : "POST";

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

      router.push("/dashboard/magazin");
      router.refresh();
    } catch (err) {
      setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{article ? "Artikel bearbeiten" : "Neuer Artikel"}</CardTitle>
        <CardDescription>
          {article ? "Bearbeiten Sie den Artikel" : "Erstellen Sie einen neuen Artikel"}
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
            <Label htmlFor="title">Titel *</Label>
            <Input
              id="title"
              placeholder="z.B. Die besten Campingplätze in Deutschland"
              {...register("title")}
              onChange={handleTitleChange}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              placeholder="z.B. beste-campingplaetze-deutschland"
              {...register("slug")}
              disabled={isLoading}
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-sm text-muted-foreground">
              URL-freundlicher Name für den Artikel
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Kurzbeschreibung</Label>
            <Textarea
              id="excerpt"
              placeholder="Eine kurze Zusammenfassung des Artikels..."
              rows={3}
              {...register("excerpt")}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Inhalt *</Label>
            <Textarea
              id="content"
              placeholder="Schreiben Sie Ihren Artikel..."
              rows={15}
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

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Tag hinzufügen..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                disabled={isLoading}
              />
              <Button type="button" onClick={addTag} variant="outline">
                Hinzufügen
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="published"
              checked={watch("published")}
              onCheckedChange={(checked) => setValue("published", checked === true)}
              disabled={isLoading}
            />
            <Label htmlFor="published" className="cursor-pointer">
              Veröffentlichen
            </Label>
          </div>

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Wird gespeichert..." : article ? "Aktualisieren" : "Erstellen"}
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

