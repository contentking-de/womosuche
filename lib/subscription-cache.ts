import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { randomUUID } from "crypto";

/**
 * Lädt die Subscription für einen User mit automatischer Synchronisation basierend auf Cache
 * 
 * @param userId - Die ID des Users
 * @param forceSync - Wenn true, ignoriert den Cache und synchronisiert immer
 * @returns Die Subscription oder null wenn keine gefunden wurde
 */
export async function getCachedSubscription(
  userId: string,
  forceSync: boolean = false
) {
  // Lade Subscription aus der Datenbank
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  // Wenn keine Subscription vorhanden und kein Force-Sync, gib null zurück
  if (!subscription && !forceSync) {
    return null;
  }

  // Cache-Mechanismus: Synchronisiere nur, wenn nötig
  const now = new Date();
  // Verwende updatedAt als Fallback für lastSyncedAt (falls lastSyncedAt nicht verfügbar ist)
  const lastSyncedAt = (subscription as any)?.lastSyncedAt || subscription?.updatedAt;

  // Bestimme Cache-Dauer basierend auf Status
  let cacheDurationMinutes = 30; // Standard: 30 Minuten für aktive Subscriptions
  if (subscription?.status === "incomplete" || subscription?.status === "incomplete_expired") {
    cacheDurationMinutes = 2; // 2 Minuten für incomplete Subscriptions (häufigere Updates)
  }

  // Prüfe ob Synchronisation nötig ist
  const needsSync = !subscription || 
    (subscription.status !== "active" && subscription.status !== "trialing") || 
    !subscription.stripePriceId ||
    !subscription.stripeSubscriptionId;

  // Prüfe ob Cache abgelaufen ist
  const cacheExpired = !lastSyncedAt || 
    (now.getTime() - lastSyncedAt.getTime()) > (cacheDurationMinutes * 60 * 1000);

  // Synchronisiere wenn nötig oder Cache abgelaufen oder Force-Sync
  const shouldSync = forceSync || needsSync || cacheExpired;

  if (shouldSync) {
    try {
      // Versuche Customer über E-Mail zu finden
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!userData?.email) {
        return subscription;
      }

      const customers = await stripe.customers.list({
        email: userData.email,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return subscription;
      }

      const customer = customers.data[0];

      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 10,
      });

      const sortedSubscriptions = subscriptions.data.sort(
        (a, b) => b.created - a.created
      );

      // Suche zuerst nach aktiver Subscription, dann nach incomplete (falls noch keine Subscription-ID vorhanden)
      let targetSubscription = sortedSubscriptions.find(
        (sub) => sub.status === "active" || sub.status === "trialing"
      );

      // Wenn keine aktive Subscription gefunden, aber Subscription-ID fehlt, nimm die neueste incomplete
      if (!targetSubscription && !subscription?.stripeSubscriptionId) {
        targetSubscription = sortedSubscriptions.find(
          (sub) => sub.status === "incomplete" || sub.status === "incomplete_expired"
        );
      }

      if (targetSubscription) {
        const stripeSub = targetSubscription as any;
        const priceId = stripeSub.items.data[0]?.price.id;

        if (priceId) {
          const wasCreated = !subscription;
          try {
            // Erstelle Update-Daten ohne lastSyncedAt (falls Feld nicht verfügbar)
            const updateData: any = {
              stripeCustomerId: customer.id,
              stripeSubscriptionId: stripeSub.id,
              stripePriceId: priceId,
              status: stripeSub.status,
              currentPeriodEnd: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null,
              cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
            };

            subscription = await prisma.subscription.upsert({
              where: { userId },
              create: {
                id: randomUUID(),
                userId,
                ...updateData,
              },
              update: updateData,
            });

            console.log(`[Subscription Cache] Subscription synchronisiert für User ${userId}:`, {
              stripeSubscriptionId: stripeSub.id,
              status: stripeSub.status,
              priceId: priceId,
              wasCreated,
            });
          } catch (upsertError: any) {
            console.error(`[Subscription Cache] Fehler beim Upsert der Subscription für User ${userId}:`, upsertError.message);
            
            // Versuche es mit update, falls Subscription bereits existiert
            try {
              subscription = await prisma.subscription.update({
                where: { userId },
                data: {
                  stripeCustomerId: customer.id,
                  stripeSubscriptionId: stripeSub.id,
                  stripePriceId: priceId,
                  status: stripeSub.status,
                  currentPeriodEnd: stripeSub.current_period_end ? new Date(stripeSub.current_period_end * 1000) : null,
                  cancelAtPeriodEnd: stripeSub.cancel_at_period_end || false,
                },
              });
              
              console.log(`[Subscription Cache] Subscription erfolgreich aktualisiert für User ${userId}`);
            } catch (updateError: any) {
              console.error(`[Subscription Cache] Fehler beim Update der Subscription für User ${userId}:`, updateError.message);
            }
          }
        } else {
          console.error(`[Subscription Cache] Keine Price ID gefunden für Subscription ${stripeSub.id}`);
        }
      } else {
        // Wenn keine Subscription gefunden, logge das
        console.log(`[Subscription Cache] Keine Subscription für User ${userId} gefunden. Gefundene Status:`, 
          sortedSubscriptions.map(s => ({ id: s.id, status: s.status }))
        );
      }
    } catch (error) {
      console.error(`[Subscription Cache] Fehler beim Synchronisieren der Subscription für User ${userId}:`, error);
      // Bei Fehler gib die vorhandene Subscription zurück (falls vorhanden)
    }
  }

  // Lade Subscription erneut nach Synchronisation, falls nötig
  if (shouldSync) {
    subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
  }

  return subscription;
}

