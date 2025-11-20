import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * Debug-Route: Zeigt aktuelle Subscription-Daten aus DB und Stripe
 */
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const userId = session.user.id;

    // Hole Subscription aus DB
    const dbSubscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    // Hole alle Subscriptions von Stripe für diesen Customer
    let allStripeSubscriptions: Stripe.Subscription[] = [];
    if (dbSubscription?.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: dbSubscription.stripeCustomerId,
          status: "all",
          limit: 10,
        });
        allStripeSubscriptions = subscriptions.data.sort((a, b) => b.created - a.created);
      } catch (error) {
        console.error("Error fetching all subscriptions:", error);
      }
    }

    let stripeSubscription: Stripe.Subscription | null = null;
    let stripePrice: Stripe.Price | null = null;
    let stripeProduct: Stripe.Product | Stripe.DeletedProduct | null = null;

    if (dbSubscription?.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          dbSubscription.stripeSubscriptionId
        ) as Stripe.Subscription;
        
        if (stripeSubscription.items.data[0]?.price.id) {
          stripePrice = await stripe.prices.retrieve(
            stripeSubscription.items.data[0].price.id,
            { expand: ["product"] }
          );
          
          if (stripePrice.product) {
            stripeProduct = typeof stripePrice.product === "string"
              ? await stripe.products.retrieve(stripePrice.product)
              : stripePrice.product;
          }
        }
      } catch (error) {
        console.error("Error fetching Stripe data:", error);
      }
    }

    // Finde die neueste aktive Subscription
    const newestActiveSubscription = allStripeSubscriptions.find(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    let newestPrice: Stripe.Price | null = null;
    let newestProduct: Stripe.Product | Stripe.DeletedProduct | null = null;
    if (newestActiveSubscription?.items.data[0]?.price.id) {
      try {
        newestPrice = await stripe.prices.retrieve(
          newestActiveSubscription.items.data[0].price.id,
          { expand: ["product"] }
        );
        
        if (newestPrice.product) {
          newestProduct = typeof newestPrice.product === "string"
            ? await stripe.products.retrieve(newestPrice.product)
            : newestPrice.product;
        }
      } catch (error) {
        console.error("Error fetching newest price:", error);
      }
    }

    return NextResponse.json({
      db: {
        subscription: dbSubscription,
      },
      stripe: {
        // Subscription aus DB (kann alt sein)
        subscription: stripeSubscription ? {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          created: stripeSubscription.created,
          current_period_end: stripeSubscription ? (stripeSubscription as any).current_period_end ?? null : null,
          items: stripeSubscription.items.data.map((item: Stripe.SubscriptionItem) => {
            const price = typeof item.price === "string" ? null : item.price;
            return {
              priceId: price?.id || (typeof item.price === "string" ? item.price : null),
              priceAmount: price?.unit_amount || null,
              priceCurrency: price?.currency || null,
            };
          }),
        } : null,
        price: stripePrice ? {
          id: stripePrice.id,
          amount: stripePrice.unit_amount,
          currency: stripePrice.currency,
        } : null,
        product: stripeProduct && "name" in stripeProduct ? {
          id: stripeProduct.id,
          name: stripeProduct.name,
        } : stripeProduct ? {
          id: stripeProduct.id,
          name: "[Deleted Product]",
        } : null,
        // NEUESTE aktive Subscription (sollte verwendet werden)
        newestActiveSubscription: newestActiveSubscription ? {
          id: newestActiveSubscription.id,
          status: newestActiveSubscription.status,
          created: newestActiveSubscription.created,
          current_period_end: (newestActiveSubscription as any).current_period_end ?? null,
          items: newestActiveSubscription.items.data.map((item: Stripe.SubscriptionItem) => ({
            priceId: item.price.id,
            priceAmount: typeof item.price === "string" ? null : item.price.unit_amount,
            priceCurrency: typeof item.price === "string" ? null : item.price.currency,
          })),
        } : null,
        newestPrice: newestPrice ? {
          id: newestPrice.id,
          amount: newestPrice.unit_amount,
          currency: newestPrice.currency,
        } : null,
        newestProduct: newestProduct && "name" in newestProduct ? {
          id: newestProduct.id,
          name: newestProduct.name,
        } : newestProduct ? {
          id: newestProduct.id,
          name: "[Deleted Product]",
        } : null,
        // Alle Subscriptions (sortiert nach created, neueste zuerst)
        allSubscriptions: allStripeSubscriptions.map((sub: Stripe.Subscription) => ({
          id: sub.id,
          status: sub.status,
          created: sub.created,
          priceId: typeof sub.items.data[0]?.price === "string" 
            ? sub.items.data[0]?.price 
            : sub.items.data[0]?.price?.id,
        })),
      },
    });
  } catch (error) {
    console.error("Error in debug route:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Debug-Daten" },
      { status: 500 }
    );
  }
}

