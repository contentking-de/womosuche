"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewsletterImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [list, setList] = useState<"NEWS" | "REISEBERICHTE" | "VERMIETUNGEN" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setError("Bitte wählen Sie eine CSV-Datei aus");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError("Bitte wählen Sie eine CSV-Datei aus");
      return;
    }

    if (!list) {
      setError("Bitte wählen Sie eine Newsletter-Liste aus");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("list", list);

      const response = await fetch("/api/newsletter/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Fehler beim Importieren");
      }

      setSuccess(`Erfolgreich ${result.imported} Subscriber importiert`);
      setFile(null);
      setList("");
      
      // Reset file input
      const fileInput = document.getElementById("csv-file") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/dashboard/newsletter">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Newsletter-Verwaltung
        </Button>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>CSV Import</CardTitle>
          <CardDescription>
            Importieren Sie Subscriber aus einer CSV-Datei. Die CSV sollte eine Spalte "email" oder "E-Mail" enthalten, optional auch "name" oder "Vorname"/"Nachname".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Select value={list} onValueChange={(value) => setList(value as typeof list)}>
                <SelectTrigger>
                  <SelectValue placeholder="Liste auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEWS">News & Aktuelles</SelectItem>
                  <SelectItem value="REISEBERICHTE">Reiseberichte</SelectItem>
                  <SelectItem value="VERMIETUNGEN">Vermietungen & Tipps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV-Datei *</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Die CSV-Datei sollte eine Spalte "email" oder "E-Mail" enthalten, optional auch "name" oder "Vorname"/"Nachname". 
                Die erste Zeile sollte die Spaltenüberschriften enthalten.
              </p>
            </div>

            <Button type="submit" disabled={isLoading || !file || !list}>
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? "Importiere..." : "Importieren"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

