import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { getCachedSubscription } from "@/lib/subscription-cache";
import { SettingsForm } from "@/components/dashboard/settings-form";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { RefreshSubscription } from "@/components/dashboard/refresh-subscription";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;

  // Lade vollständige Benutzerdaten
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      editorProfile: true,
      profileImage: true,
      street: true,
      city: true,
      postalCode: true,
      country: true,
    },
  });

  if (!userData) {
    return null;
  }

  // Lade Subscription für LANDLORD mit automatischem Caching
  // Wenn plan=changed, erzwinge Synchronisation (forceSync=true)
  let subscription = null;
  let currentVehiclesCount = 0;
  if (user.role === "LANDLORD") {
    subscription = await getCachedSubscription(user.id, params.plan === "changed");
    
    // Zähle aktuelle Fahrzeuge
    currentVehiclesCount = await prisma.listing.count({
      where: { ownerId: user.id },
    });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Einstellungen</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalte deine Kontoeinstellungen und Profildaten.
        </p>
      </div>

      {/* Subscription-Anzeige für LANDLORD */}
      {user.role === "LANDLORD" && (
        <div className="mb-6">
          {params.plan === "changed" && (
            <RefreshSubscription />
          )}
          <SubscriptionCard subscription={subscription} currentVehiclesCount={currentVehiclesCount} showActions={true} />
        </div>
      )}

      <SettingsForm user={userData} />
    </div>
  );
}

