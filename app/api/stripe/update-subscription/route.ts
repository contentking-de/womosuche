import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSubscriptionSchema = z.object({
  newPriceId: z.string().min(1, "Price ID ist erforderlich"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { newPriceId } = updateSubscriptionSchema.parse(body);

    // Hole aktuelle Subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Keine aktive Subscription gefunden" },
        { status: 404 }
      );
    }

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        { error: "Subscription ist nicht aktiv" },
        { status: 400 }
      );
    }

    // Hole aktuelle Subscription von Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );

    // Prüfe ob der neue Preis bereits verwendet wird
    const currentPriceId = stripeSubscription.items.data[0]?.price.id;
    if (currentPriceId === newPriceId) {
      return NextResponse.json(
        { error: "Dieser Plan ist bereits aktiv" },
        { status: 400 }
      );
    }

    // Aktualisiere Subscription mit neuem Preis
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.stripeSubscriptionId,
      {
        items: [
          {
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: "always_invoice", // Erstelle sofort eine Rechnung für die Differenz
      }
    );

    // Aktualisiere lokale Datenbank
    const updatedSub = updatedSubscription as any;
    await prisma.subscription.update({
      where: { userId },
      data: {
        stripePriceId: newPriceId,
        status: updatedSub.status,
        currentPeriodEnd: new Date(updatedSub.current_period_end * 1000),
        cancelAtPeriodEnd: updatedSub.cancel_at_period_end || false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Subscription erfolgreich aktualisiert",
      subscription: {
        priceId: newPriceId,
        status: updatedSub.status,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json(
      { error: `Fehler beim Aktualisieren der Subscription: ${errorMessage}` },
      { status: 500 }
    );
  }
}

