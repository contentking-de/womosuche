"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, AlertCircle, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");

    if (success === "verified") {
      setStatus("success");
      setMessage("Deine E-Mail-Adresse wurde erfolgreich bestätigt! Du kannst dich jetzt anmelden.");
    } else if (success === "already-verified") {
      setStatus("success");
      setMessage("Deine E-Mail-Adresse wurde bereits bestätigt. Du kannst dich anmelden.");
    } else if (error === "missing-token") {
      setStatus("error");
      setMessage("Der Bestätigungslink ist ungültig. Bitte verwende den Link aus der E-Mail.");
    } else if (error === "invalid-token") {
      setStatus("error");
      setMessage("Der Bestätigungslink ist ungültig oder wurde bereits verwendet.");
    } else if (error === "expired-token") {
      setStatus("error");
      setMessage("Der Bestätigungslink ist abgelaufen. Bitte registriere dich erneut.");
    } else if (error === "user-not-found") {
      setStatus("error");
      setMessage("Benutzer nicht gefunden. Bitte registriere dich erneut.");
    } else if (error === "verification-failed") {
      setStatus("error");
      setMessage("Die Bestätigung ist fehlgeschlagen. Bitte versuche es erneut.");
    } else {
      setStatus("error");
      setMessage("Ungültiger Bestätigungslink.");
    }
  }, [searchParams]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-md">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-600" />}
              {status === "error" && <XCircle className="h-6 w-6 text-red-600" />}
              {status === "loading" && <AlertCircle className="h-6 w-6 text-yellow-600" />}
              E-Mail-Bestätigung
            </CardTitle>
            <CardDescription>
              {status === "success" && "Bestätigung erfolgreich"}
              {status === "error" && "Bestätigung fehlgeschlagen"}
              {status === "loading" && "Wird verarbeitet..."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {status === "success" && (
              <>
                <div className="rounded-md bg-green-50 border border-green-200 p-4">
                  <p className="text-sm text-green-800">{message}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/login">
                    <Button className="w-full">Zur Anmeldung</Button>
                  </Link>
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="rounded-md bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-800">{message}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Link href="/register">
                    <Button className="w-full">Erneut registrieren</Button>
                  </Link>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">
                      Zur Anmeldung
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === "loading" && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Wird verarbeitet...</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

