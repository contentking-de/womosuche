import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ priceId: string }> }
) {
  try {
    const { priceId } = await params;

    // Hole den Preis von Stripe
    const price = await stripe.prices.retrieve(priceId, {
      expand: ["product"],
    });

      const product = price.product;
      const productData = typeof product === "string" 
        ? await stripe.products.retrieve(product)
        : product;

      // Prüfe ob Product gelöscht wurde
      if ("deleted" in productData && productData.deleted) {
        return NextResponse.json(
          { error: "Produkt wurde gelöscht" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        plan: {
          id: productData.id,
          name: productData.name,
          description: productData.description || null,
          priceId: price.id,
          amount: price.unit_amount ? price.unit_amount / 100 : 0,
          currency: price.currency,
          interval: price.recurring?.interval || "month",
        },
      });
  } catch (error) {
    console.error("Error fetching Stripe plan:", error);
    
    return NextResponse.json(
      { 
        error: "Fehler beim Abrufen des Plans",
        details: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 500 }
    );
  }
}

