import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ListingForm } from "@/components/listings/listing-form";
import { checkVehicleLimit } from "@/lib/subscription-limits";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewListingPage() {
  const user = await requireAuth();

  // Lade User-Liste für Admin
  const availableUsers =
    user.role === "ADMIN"
      ? await prisma.user.findMany({
          where: { role: "LANDLORD" },
          select: {
            id: true,
            name: true,
            email: true,
          },
          orderBy: { name: "asc" },
        })
      : [];

  // Prüfe Fahrzeug-Limit für LANDLORD
  let limitCheck = null;
  let canCreate = true;
  if (user.role === "LANDLORD") {
    limitCheck = await checkVehicleLimit(user.id);
    canCreate = limitCheck.canCreate;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neues Wohnmobil anlegen</h1>
        <p className="mt-2 text-muted-foreground">
          Fügen Sie ein neues Wohnmobil zu Ihrem Inventar hinzu
        </p>
      </div>

      {limitCheck && !canCreate && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {limitCheck.maxCount === null ? "Kein aktives Abonnement" : "Limit erreicht"}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            {limitCheck.reason && (
              <p>{limitCheck.reason}</p>
            )}
            {limitCheck.maxCount !== null && (
              <p className="text-sm">
                Aktuell: {limitCheck.currentCount} / {limitCheck.maxCount} Fahrzeuge
              </p>
            )}
            <Link href="/dashboard/change-plan">
              <Button variant="secondary" size="sm" className="mt-2">
                {limitCheck.maxCount === null ? "Plan auswählen" : "Jetzt upgraden"}
              </Button>
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {limitCheck && canCreate && limitCheck.maxCount !== null && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Fahrzeug-Limit</AlertTitle>
          <AlertDescription>
            Sie haben {limitCheck.currentCount} von {limitCheck.maxCount} Fahrzeugen verwendet.
            {limitCheck.planName && ` (Plan: ${limitCheck.planName})`}
          </AlertDescription>
        </Alert>
      )}

      <ListingForm
        userRole={user.role}
        ownerId={user.id}
        availableUsers={availableUsers}
        disabled={!canCreate}
      />
    </div>
  );
}

