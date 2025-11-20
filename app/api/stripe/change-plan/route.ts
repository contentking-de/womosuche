import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const changePlanSchema = z.object({
  priceId: z.string().min(1, "Price ID ist erforderlich"),
});

/**
 * Erstellt eine Checkout Session zum Wechseln des Subscription-Plans
 * Aktualisiert die bestehende Subscription mit dem neuen Preis
 */
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
    const { priceId } = changePlanSchema.parse(body);

    // Hole aktuelle Subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId || !subscription.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "Keine Subscription gefunden" },
        { status: 404 }
      );
    }

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return NextResponse.json(
        { error: "Subscription ist nicht aktiv" },
        { status: 400 }
      );
    }

    // Prüfe ob der neue Preis bereits aktiv ist
    if (subscription.stripePriceId === priceId) {
      return NextResponse.json(
        { error: "Dieser Plan ist bereits aktiv" },
        { status: 400 }
      );
    }

    // Erstelle immer eine Checkout Session, damit der User die Zahlung bestätigt
    // und eine Rechnung generiert wird
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: subscription.stripeCustomerId,
      mode: "subscription",
      locale: "de",
      success_url: `${baseUrl}/dashboard/settings?plan=changed`,
      cancel_url: `${baseUrl}/dashboard/change-plan?plan=canceled`,
      metadata: {
        userId: userId,
        action: "change_plan",
        existingSubscriptionId: subscription.stripeSubscriptionId,
        oldPriceId: subscription.stripePriceId,
      },
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: userId,
          action: "change_plan",
          existingSubscriptionId: subscription.stripeSubscriptionId,
        },
      },
      // Erlaube Proration für Plan-Wechsel
      payment_method_collection: "always",
    });

    return NextResponse.json({ 
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating change plan checkout session:", error);
    return NextResponse.json(
      { 
        error: "Fehler beim Erstellen der Checkout-Session",
        details: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 500 }
    );
  }
}

