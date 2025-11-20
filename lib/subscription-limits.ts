import { prisma } from "@/lib/prisma";
import { getPlanLimit } from "@/lib/plan-limits";
import { stripe } from "@/lib/stripe";

/**
 * Prüft, ob ein User noch Fahrzeuge anlegen kann
 * @returns { canCreate: boolean, reason?: string, currentCount: number, maxCount: number | null }
 */
export async function checkVehicleLimit(userId: string): Promise<{
  canCreate: boolean;
  reason?: string;
  currentCount: number;
  maxCount: number | null;
  planName?: string;
}> {
  // Zähle aktuelle Fahrzeuge des Users
  const currentCount = await prisma.listing.count({
    where: { ownerId: userId },
  });

  // Hole Subscription
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // Wenn keine Subscription vorhanden, kann der User kein Fahrzeug anlegen
  if (!subscription) {
    return {
      canCreate: false,
      reason: "Kein aktives Abonnement. Bitte registriere dich für einen Plan.",
      currentCount,
      maxCount: null,
    };
  }

  // Prüfe ob Subscription aktiv ist
  if (subscription.status !== "active" && subscription.status !== "trialing") {
    return {
      canCreate: false,
      reason: `Dein Abonnement ist ${subscription.status === "canceled" ? "gekündigt" : "nicht aktiv"}.`,
      currentCount,
      maxCount: null,
    };
  }

  // Prüfe ob stripePriceId vorhanden ist
  if (!subscription.stripePriceId) {
    return {
      canCreate: false,
      reason: "Kein aktives Abonnement. Bitte registriere dich für einen Plan.",
      currentCount,
      maxCount: null,
    };
  }

  // Hole Plan-Informationen von Stripe
  try {
    const price = await stripe.prices.retrieve(subscription.stripePriceId, {
      expand: ["product"],
    });

    const product = price.product;
    const productData = typeof product === "string" 
      ? await stripe.products.retrieve(product)
      : product;

    const planName = "name" in productData ? productData.name : "[Deleted Product]";
    const amount = price.unit_amount ? price.unit_amount / 100 : 0;

    // Ermittle das Limit
    const limit = getPlanLimit(planName, amount);

    // Prüfe ob Limit erreicht
    if (limit.maxVehicles === null) {
      // Unbegrenzt
      return {
        canCreate: true,
        currentCount,
        maxCount: null,
        planName,
      };
    }

    if (currentCount >= limit.maxVehicles) {
      return {
        canCreate: false,
        reason: `Du hast das Maximum von ${limit.maxVehicles} Fahrzeugen erreicht. Bitte upgrade deinen Plan.`,
        currentCount,
        maxCount: limit.maxVehicles,
        planName,
      };
    }

    return {
      canCreate: true,
      currentCount,
      maxCount: limit.maxVehicles,
      planName,
    };
  } catch (error) {
    console.error("Error checking vehicle limit:", error);
    // Bei Fehler erlauben wir das Anlegen NICHT (Fail-Closed für Sicherheit)
    return {
      canCreate: false,
      currentCount,
      maxCount: null,
      reason: "Du musst deinen Plan upgraden, um neue Wohnmobile anzulegen.",
    };
  }
}

