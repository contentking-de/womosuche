import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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

    // Hole Subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json(
        { error: "Keine Subscription gefunden" },
        { status: 404 }
      );
    }

    // Erstelle Customer Portal Session
    // Das Portal erlaubt standardmäßig Upgrades/Downgrades, wenn die Produkte
    // im Stripe Dashboard richtig konfiguriert sind (gleiche Produkt-Family oder
    // Portal-Einstellungen aktiviert)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/dashboard/settings`,
      locale: "de", // Setze Sprache auf Deutsch
    });

    return NextResponse.json({ 
      url: portalSession.url 
    });
  } catch (error) {
    console.error("Error creating customer portal session:", error);
    return NextResponse.json(
      { 
        error: "Fehler beim Erstellen der Portal-Session",
        details: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 500 }
    );
  }
}

