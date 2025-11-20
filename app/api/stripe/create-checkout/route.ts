import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkoutSchema = z.object({
  priceId: z.string().min(1, "Price ID ist erforderlich"),
  userId: z.string().uuid("Ungültige User ID"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, userId } = checkoutSchema.parse(body);

    // Prüfe ob User existiert und LANDLORD ist
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    if (user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Nur Vermieter können Subscriptions abschließen" },
        { status: 403 }
      );
    }

    // Erstelle oder hole Stripe Customer
    let customerId: string;
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription) {
      customerId = existingSubscription.stripeCustomerId;
    } else {
      // Erstelle neuen Stripe Customer mit deutscher Sprache
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
        preferred_locales: ["de"], // Setze Sprache auf Deutsch
      });
      customerId = customer.id;
    }
    
    // Aktualisiere bestehenden Customer mit deutscher Sprache (falls noch nicht gesetzt)
    if (existingSubscription) {
      try {
        await stripe.customers.update(existingSubscription.stripeCustomerId, {
          preferred_locales: ["de"],
        });
      } catch (error) {
        console.error("Error updating customer locale:", error);
        // Nicht kritisch, weiter machen
      }
    }

    // Erstelle Checkout Session
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      locale: "de", // Setze Sprache auf Deutsch für Checkout
      automatic_tax: {
        enabled: true,
      },
      success_url: `${baseUrl}/dashboard?subscription=success`,
      cancel_url: `${baseUrl}/register?subscription=canceled`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Fehler beim Erstellen der Checkout-Session" },
      { status: 500 }
    );
  }
}

