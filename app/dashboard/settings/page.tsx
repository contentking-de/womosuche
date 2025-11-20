import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
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
    },
  });

  if (!userData) {
    return null;
  }

  // Lade Subscription für LANDLORD
  let subscription = null;
  let currentVehiclesCount = 0;
  if (user.role === "LANDLORD") {
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    
    // Wenn plan=changed, synchronisiere automatisch mit Stripe
    if (params.plan === "changed" && subscription?.stripeCustomerId) {
      try {
        const { stripe } = await import("@/lib/stripe");
        const subscriptions = await stripe.subscriptions.list({
          customer: subscription.stripeCustomerId,
          status: "all",
          limit: 10,
        });

        const sortedSubscriptions = subscriptions.data.sort(
          (a, b) => b.created - a.created
        );
        
        const activeSubscription = sortedSubscriptions.find(
          (sub) => sub.status === "active" || sub.status === "trialing"
        );

        if (activeSubscription) {
          const stripeSub = activeSubscription as any;
          const priceId = stripeSub.items.data[0]?.price.id;
          
          if (priceId && priceId !== subscription.stripePriceId) {
            // Aktualisiere die Subscription in der DB
            subscription = await prisma.subscription.update({
              where: { userId: user.id },
              data: {
                stripeSubscriptionId: stripeSub.id,
                stripePriceId: priceId,
                status: stripeSub.status,
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error auto-syncing subscription:", error);
        // Nicht kritisch, weiter mit vorhandener Subscription
      }
    }
    
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

