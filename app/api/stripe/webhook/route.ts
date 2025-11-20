import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import Stripe from "stripe";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Keine Stripe-Signatur gefunden" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET ist nicht konfiguriert");
    return NextResponse.json(
      { error: "Webhook-Secret nicht konfiguriert" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook-Signatur-Verifizierung fehlgeschlagen:", err);
    return NextResponse.json(
      { error: "Ungültige Signatur" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const action = session.metadata?.action;

        if (!userId || !session.customer) {
          console.error("Fehlende Metadaten in Checkout Session");
          break;
        }

        // Hole Subscription-Details von Stripe
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) {
          console.error("Keine Subscription ID in Checkout Session");
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const sub = subscription as any;
        const priceId = sub.items.data[0]?.price.id;

        if (!priceId) {
          console.error("Keine Price ID in Subscription gefunden");
          break;
        }

        // Prüfe ob es ein Plan-Wechsel ist (bestehende Subscription ersetzen)
        if (action === "change_plan" && session.metadata?.existingSubscriptionId) {
          const oldSubscriptionId = session.metadata.existingSubscriptionId;
          
          // Finde bestehende Subscription
          const existingSubscription = await prisma.subscription.findUnique({
            where: { userId },
          });

          // Kündige die alte Subscription, falls sie noch existiert und aktiv ist
          if (oldSubscriptionId && oldSubscriptionId !== subscriptionId) {
            try {
              const oldSub = await stripe.subscriptions.retrieve(oldSubscriptionId);
              if (oldSub.status === "active" || oldSub.status === "trialing") {
                await stripe.subscriptions.cancel(oldSubscriptionId);
                console.log(`[Webhook] Alte Subscription ${oldSubscriptionId} gekündigt`);
              }
            } catch (cancelError) {
              // Subscription existiert möglicherweise nicht mehr oder ist bereits gekündigt
              console.log(`[Webhook] Alte Subscription ${oldSubscriptionId} konnte nicht gekündigt werden (möglicherweise bereits gekündigt)`);
            }
          }

          // Aktualisiere die Subscription in der DB mit der neuen Subscription ID
          if (existingSubscription) {
            await prisma.subscription.update({
              where: { userId },
              data: {
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                status: sub.status,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
              },
            });
            console.log(`[Webhook] Subscription für User ${userId} aktualisiert: ${oldSubscriptionId} -> ${subscriptionId}, Price: ${priceId}`);
          } else {
            // Fallback: Erstelle neue Subscription
            await prisma.subscription.create({
              data: {
                id: randomUUID(),
                userId,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: priceId,
                status: sub.status,
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end || false,
              },
            });
            console.log(`[Webhook] Neue Subscription für User ${userId} erstellt: ${subscriptionId}, Price: ${priceId}`);
          }
        } else {
          // Normale Subscription-Erstellung oder Update
          await prisma.subscription.upsert({
            where: { userId },
            create: {
              id: randomUUID(),
              userId,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            },
            update: {
              stripeSubscriptionId: subscriptionId,
              stripePriceId: priceId,
              status: sub.status,
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            },
          });
        }

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = subscription as any;
        const customerId = sub.customer as string;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          // Hole aktuelle Price ID von der Subscription
          const priceId = sub.items.data[0]?.price.id;

          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              stripePriceId: priceId || dbSubscription.stripePriceId, // Aktualisiere priceId falls vorhanden
              stripeSubscriptionId: sub.id,
              status: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            },
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const sub = subscription as any;
        const customerId = sub.customer as string;

        const dbSubscription = await prisma.subscription.findUnique({
          where: { stripeCustomerId: customerId },
        });

        if (dbSubscription) {
          await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
              status: sub.status,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : null,
              cancelAtPeriodEnd: sub.cancel_at_period_end || false,
            },
          });
        }

        break;
      }

      default:
        console.log(`Unbehandeltes Event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook-Verarbeitungsfehler:", error);
    return NextResponse.json(
      { error: "Webhook-Verarbeitung fehlgeschlagen" },
      { status: 500 }
    );
  }
}

