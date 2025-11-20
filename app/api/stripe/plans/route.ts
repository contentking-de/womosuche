import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET() {
  try {
    // Hole alle aktiven Produkte mit ihren Preisen
    const products = await stripe.products.list({
      active: true,
      expand: ["data.default_price"],
    });

    console.log(`Found ${products.data.length} active products in Stripe`);

    const plans = products.data
      .map((product) => {
        const price = product.default_price;
        if (!price || typeof price === "string") {
          console.warn(`Product ${product.id} (${product.name}) has no valid default_price`);
          return null;
        }

        // Prüfe ob es ein recurring price ist (für Subscriptions benötigt)
        if (!price.recurring) {
          console.warn(`Product ${product.id} (${product.name}) has no recurring price`);
          return null;
        }

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          priceId: price.id,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency,
          interval: price.recurring?.interval || "month",
        };
      })
      .filter(Boolean)
      .sort((a, b) => (a?.amount || 0) - (b?.amount || 0));

    if (plans.length === 0) {
      console.warn("No valid subscription plans found. Make sure you have active products with recurring prices in Stripe.");
    }

    return NextResponse.json({ plans });
  } catch (error) {
    console.error("Error fetching Stripe plans:", error);
    
    // Detailliertere Fehlermeldung
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    
    return NextResponse.json(
      { 
        error: "Fehler beim Abrufen der Pläne",
        details: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 500 }
    );
  }
}

