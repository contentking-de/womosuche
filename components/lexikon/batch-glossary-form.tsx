"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, FileText } from "lucide-react";

interface BatchResult {
  term: string;
  success: boolean;
  slug?: string;
  error?: string;
}

export function BatchGlossaryForm() {
  const router = useRouter();
  const [terms, setTerms] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!terms.trim()) {
      setError("Bitte geben Sie mindestens einen Begriff ein.");
      return;
    }

    // Parse Begriffe (ein Begriff pro Zeile)
    const termList = terms
      .split("\n")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (termList.length === 0) {
      setError("Bitte geben Sie mindestens einen Begriff ein.");
      return;
    }

    if (termList.length > 10) {
      setError(`Zu viele Begriffe. Maximum sind 10 Begriffe pro Batch. Bitte teilen Sie die Liste auf.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setIsComplete(false);

    try {
      const response = await fetch("/api/lexikon/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: termList }),
      });

      // Bei 504 Timeout-Fehler spezielle Behandlung
      if (response.status === 504) {
        setError("Die Verarbeitung hat zu lange gedauert (Timeout). Einige Begriffe wurden möglicherweise bereits erstellt. Bitte prüfen Sie das Lexikon.");
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Ein Fehler ist aufgetreten");
        setIsLoading(false);
        return;
      }

      setResults(data.results || []);
      setIsComplete(true);
      setIsLoading(false);
    } catch (err) {
      // Bei Timeout-Fehlern (504) informieren, dass möglicherweise einige Begriffe bereits erstellt wurden
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('504') || errorMessage.includes('timeout')) {
        setError("Die Verarbeitung hat zu lange gedauert (Timeout). Einige Begriffe wurden möglicherweise bereits erstellt. Bitte prüfen Sie das Lexikon.");
      } else {
        setError("Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.");
      }
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setTerms("");
    setResults([]);
    setError(null);
    setIsComplete(false);
  };

  const successCount = results.filter((r) => r.success).length;
  const errorCount = results.filter((r) => !r.success).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch-Erstellung von Lexikon-Begriffen</CardTitle>
        <CardDescription>
          Geben Sie mehrere Begriffe ein (ein Begriff pro Zeile). Die KI generiert
          automatisch für jeden Begriff einen vollständigen Lexikon-Eintrag.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="terms">Begriffe (ein Begriff pro Zeile) *</Label>
            <Textarea
              id="terms"
              placeholder="Wohnmobil&#10;Stellplatz&#10;Kompaktwohnmobil&#10;..."
              rows={10}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              disabled={isLoading}
              className="font-mono text-sm"
            />
            <p className="text-sm text-muted-foreground">
              {terms.split("\n").filter((t) => t.trim().length > 0).length} Begriff(e) erkannt
              {terms.split("\n").filter((t) => t.trim().length > 0).length > 10 && (
                <span className="text-destructive ml-2">
                  ⚠️ Maximum sind 10 Begriffe pro Batch. Bitte teilen Sie die Liste auf.
                </span>
              )}
            </p>
          </div>

          {!isComplete && (
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading || !terms.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird verarbeitet...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Begriffe generieren
                  </>
                )}
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
          )}

          {isComplete && (
            <div className="space-y-4">
              <div className={`rounded-md p-4 ${
                successCount > 0 && errorCount === 0
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : successCount > 0
                  ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${
                      successCount > 0 && errorCount === 0
                        ? "text-green-800 dark:text-green-200"
                        : successCount > 0
                        ? "text-yellow-800 dark:text-yellow-200"
                        : "text-red-800 dark:text-red-200"
                    }`}>
                      {successCount > 0 && errorCount === 0
                        ? "✓ Alle Begriffe erfolgreich erstellt!"
                        : successCount > 0
                        ? "⚠ Verarbeitung teilweise erfolgreich"
                        : "✗ Verarbeitung fehlgeschlagen"}
                    </p>
                    <p className={`text-sm mt-1 ${
                      successCount > 0 && errorCount === 0
                        ? "text-green-700 dark:text-green-300"
                        : successCount > 0
                        ? "text-yellow-700 dark:text-yellow-300"
                        : "text-red-700 dark:text-red-300"
                    }`}>
                      {successCount} erfolgreich, {errorCount} Fehler
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                    >
                      Neue Begriffe
                    </Button>
                    <Button
                      type="button"
                      onClick={() => router.push("/dashboard/lexikon")}
                    >
                      Zum Lexikon
                    </Button>
                  </div>
                </div>
              </div>

              {results.length > 0 && (
                <div className="space-y-2">
                  <Label>Ergebnisse:</Label>
                  <div className="rounded-md border max-h-96 overflow-y-auto">
                    <div className="divide-y">
                      {results.map((result, index) => (
                        <div
                          key={index}
                          className={`p-3 ${
                            result.success
                              ? "bg-green-50 dark:bg-green-900/20"
                              : "bg-red-50 dark:bg-red-900/20"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium">{result.term}</p>
                              {result.success && result.slug && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Slug: {result.slug}
                                </p>
                              )}
                              {!result.success && result.error && (
                                <p className="text-sm text-destructive mt-1">
                                  {result.error}
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              {result.success ? (
                                <span className="text-green-600 dark:text-green-400">
                                  ✓
                                </span>
                              ) : (
                                <span className="text-red-600 dark:text-red-400">
                                  ✗
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

