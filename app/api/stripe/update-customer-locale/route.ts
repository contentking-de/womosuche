import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

/**
 * Aktualisiert die Spracheinstellung für alle bestehenden Customers auf Deutsch
 * Kann manuell aufgerufen werden, um bestehende Customers zu aktualisieren
 */
export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    // Hole alle Subscriptions
    const subscriptions = await prisma.subscription.findMany({
      select: {
        stripeCustomerId: true,
      },
    });

    const results = {
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Aktualisiere jeden Customer
    for (const subscription of subscriptions) {
      try {
        await stripe.customers.update(subscription.stripeCustomerId, {
          preferred_locales: ["de"],
        });
        results.updated++;
      } catch (error) {
        results.failed++;
        results.errors.push(
          `Customer ${subscription.stripeCustomerId}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.updated} Customers aktualisiert, ${results.failed} Fehler`,
      results,
    });
  } catch (error) {
    console.error("Error updating customer locales:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Spracheinstellungen" },
      { status: 500 }
    );
  }
}

