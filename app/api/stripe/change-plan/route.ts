import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

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

    // Hole User-Daten für Customer-Erstellung falls nötig
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Hole aktuelle Subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Fall 1: Keine Subscription vorhanden - Erstelle neue Subscription
    if (!subscription || !subscription.stripeCustomerId) {
      // Erstelle oder hole Stripe Customer
      let customerId: string;
      
      if (subscription?.stripeCustomerId) {
        // Customer-ID existiert in DB, aber prüfe ob sie in Stripe noch existiert
        try {
          await stripe.customers.retrieve(subscription.stripeCustomerId);
          customerId = subscription.stripeCustomerId;
        } catch (error) {
          // Customer existiert nicht mehr in Stripe, erstelle neuen
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name || undefined,
            metadata: {
              userId: user.id,
            },
            preferred_locales: ["de"],
          });
          customerId = customer.id;
          
          // Aktualisiere Subscription mit neuer Customer-ID
          if (subscription) {
            await prisma.subscription.update({
              where: { userId },
              data: { stripeCustomerId: customerId },
            });
          }
        }
      } else {
        // Keine Customer-ID vorhanden, erstelle neuen Customer
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name || undefined,
          metadata: {
            userId: user.id,
          },
          preferred_locales: ["de"],
        });
        customerId = customer.id;
        
        // Erstelle Subscription-Eintrag in DB (falls noch nicht vorhanden)
        if (!subscription) {
          await prisma.subscription.create({
            data: {
              id: randomUUID(),
              userId: userId,
              stripeCustomerId: customerId,
              stripePriceId: priceId, // Wird später aktualisiert
              status: "incomplete",
            },
          });
        } else {
          // Aktualisiere bestehende Subscription mit Customer-ID
          await prisma.subscription.update({
            where: { userId },
            data: { stripeCustomerId: customerId },
          });
        }
      }

      // Erstelle Checkout Session für neue Subscription
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        locale: "de",
        success_url: `${baseUrl}/dashboard/settings?plan=changed`,
        cancel_url: `${baseUrl}/dashboard/change-plan?plan=canceled`,
        metadata: {
          userId: userId,
          action: "new_subscription",
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
      });

      return NextResponse.json({ 
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    }

    // Fall 2: Subscription existiert mit Customer-ID
    // Prüfe ob Customer in Stripe noch existiert
    let customerId = subscription.stripeCustomerId;
    try {
      await stripe.customers.retrieve(customerId);
    } catch (error) {
      // Customer existiert nicht mehr, erstelle neuen
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
        preferred_locales: ["de"],
      });
      customerId = customer.id;
      
      // Aktualisiere Subscription mit neuer Customer-ID
      await prisma.subscription.update({
        where: { userId },
        data: { stripeCustomerId: customerId },
      });
    }

    // Prüfe ob Subscription aktiv ist
    if (subscription.status !== "active" && subscription.status !== "trialing") {
      // Subscription ist nicht aktiv, erstelle neue Subscription
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        locale: "de",
        success_url: `${baseUrl}/dashboard/settings?plan=changed`,
        cancel_url: `${baseUrl}/dashboard/change-plan?plan=canceled`,
        metadata: {
          userId: userId,
          action: "new_subscription",
        },
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
      });

      return NextResponse.json({ 
        url: checkoutSession.url,
        sessionId: checkoutSession.id,
      });
    }

    // Prüfe ob der neue Preis bereits aktiv ist
    if (subscription.stripePriceId === priceId) {
      return NextResponse.json(
        { error: "Dieser Plan ist bereits aktiv" },
        { status: 400 }
      );
    }

    // Fall 3: Aktive Subscription vorhanden - Plan-Wechsel
    // Erstelle Checkout Session für Plan-Wechsel
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      locale: "de",
      success_url: `${baseUrl}/dashboard/settings?plan=changed`,
      cancel_url: `${baseUrl}/dashboard/change-plan?plan=canceled`,
      metadata: {
        userId: userId,
        action: "change_plan",
        existingSubscriptionId: subscription.stripeSubscriptionId || undefined,
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
          existingSubscriptionId: subscription.stripeSubscriptionId || undefined,
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

