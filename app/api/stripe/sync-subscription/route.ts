import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import type Stripe from "stripe";

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

    // Prüfe ob bereits eine Subscription in der DB existiert
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSubscription?.stripeCustomerId) {
      // Hole alle Subscriptions für diesen Customer von Stripe
      const subscriptions = await stripe.subscriptions.list({
        customer: existingSubscription.stripeCustomerId,
        status: "all",
        limit: 10,
      });

      // Sortiere nach created (neueste zuerst) und finde die aktive Subscription
      const sortedSubscriptions = subscriptions.data.sort(
        (a, b) => b.created - a.created
      );
      
      // Debug: Log alle Subscriptions
      console.log(`[Sync] Gefundene Subscriptions für User ${userId}:`);
      sortedSubscriptions.forEach((sub, index) => {
        const priceId = sub.items.data[0]?.price.id;
        console.log(`  ${index + 1}. ${sub.id} - Status: ${sub.status} - Created: ${new Date(sub.created * 1000).toISOString()} - Price: ${priceId}`);
      });
      
      const activeSubscription = sortedSubscriptions.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );
      
      if (!activeSubscription) {
        console.log(`[Sync] Keine aktive Subscription gefunden für User ${userId}`);
      } else {
        console.log(`[Sync] Neueste aktive Subscription: ${activeSubscription.id} (Created: ${new Date(activeSubscription.created * 1000).toISOString()})`);
      }

      if (activeSubscription) {
        const stripeSub = activeSubscription as any;
        const priceId = stripeSub.items.data[0]?.price.id;
        
        if (priceId) {
          // Hole Preis-Details für Debugging
          const price = await stripe.prices.retrieve(priceId, {
            expand: ["product"],
          });
          
          const product = typeof price.product === "string"
            ? await stripe.products.retrieve(price.product)
            : price.product;

          const productName = "name" in product ? product.name : "[Deleted Product]";

          console.log(`[Sync] Aktualisiere Subscription für User ${userId}:`);
          console.log(`  - Alte Subscription ID: ${existingSubscription.stripeSubscriptionId}`);
          console.log(`  - Neue Subscription ID: ${stripeSub.id}`);
          console.log(`  - Alter Price ID: ${existingSubscription.stripePriceId}`);
          console.log(`  - Neuer Price ID: ${priceId}`);
          console.log(`  - Produkt: ${productName}, Preis: ${price.unit_amount ? price.unit_amount / 100 : 0} ${price.currency}`);

          // Aktualisiere die Subscription in der DB
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              id: randomUUID(),
              userId,
              stripeCustomerId: existingSubscription.stripeCustomerId,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: priceId,
              status: stripeSub.status,
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
            },
            update: {
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: priceId,
              status: stripeSub.status,
              currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
            },
          });

          return NextResponse.json({ 
            success: true,
            message: "Subscription synchronisiert",
            subscription: {
              status: activeSubscription.status,
              priceId,
              productName: productName,
              amount: price.unit_amount ? price.unit_amount / 100 : 0,
            },
          });
        }
      } else {
        console.log(`[Sync] Keine aktive Subscription gefunden für User ${userId}`);
      }
    }

    // Versuche, Customer über E-Mail zu finden
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.email) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        
        // Aktualisiere Customer-Sprache auf Deutsch
        try {
          await stripe.customers.update(customer.id, {
            preferred_locales: ["de"],
          });
        } catch (error) {
          console.error("Error updating customer locale:", error);
          // Nicht kritisch, weiter machen
        }
        
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 10,
        });

        const activeSubscription = subscriptions.data.find(
          (sub) => sub.status === "active" || sub.status === "trialing"
        );

        if (activeSubscription) {
          const stripeSub = activeSubscription as any;
          const priceId = stripeSub.items.data[0]?.price.id;
          
          if (priceId) {
            await prisma.subscription.upsert({
              where: { userId },
              create: {
                id: randomUUID(),
                userId,
                stripeCustomerId: customer.id,
                stripeSubscriptionId: stripeSub.id,
                stripePriceId: priceId,
                status: stripeSub.status,
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
              },
              update: {
                stripeCustomerId: customer.id,
                stripeSubscriptionId: stripeSub.id,
                stripePriceId: priceId,
                status: stripeSub.status,
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
              },
            });

            return NextResponse.json({ 
              success: true,
              message: "Subscription synchronisiert",
            });
          }
        }
      }
    }

    return NextResponse.json(
      { error: "Keine aktive Subscription in Stripe gefunden" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error syncing subscription:", error);
    return NextResponse.json(
      { error: "Fehler beim Synchronisieren der Subscription" },
      { status: 500 }
    );
  }
}

