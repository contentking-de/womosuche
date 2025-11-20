import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateAddressSchema = z.object({
  street: z.string().min(3, "Straße und Hausnummer ist erforderlich"),
  city: z.string().min(2, "Stadt ist erforderlich"),
  postalCode: z.string().min(4, "Postleitzahl ist erforderlich"),
  country: z.string().min(2, "Land ist erforderlich"),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);

    // Aktualisiere User-Adresse
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        street: validatedData.street,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        country: validatedData.country,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        street: true,
        city: true,
        postalCode: true,
        country: true,
      },
    });

    // Wenn User eine Stripe Customer-ID hat, aktualisiere auch die Adresse bei Stripe
    if (session.user.role === "LANDLORD") {
      const subscription = await prisma.subscription.findUnique({
        where: { userId: session.user.id },
      });

      if (subscription?.stripeCustomerId) {
        try {
          const { stripe } = await import("@/lib/stripe");
          await stripe.customers.update(subscription.stripeCustomerId, {
            address: {
              line1: validatedData.street,
              city: validatedData.city,
              postal_code: validatedData.postalCode,
              country: validatedData.country,
            },
          });
        } catch (stripeError) {
          console.error("Error updating Stripe customer address:", stripeError);
          // Nicht kritisch, weiter machen
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Fehler beim Aktualisieren der Adresse" },
      { status: 500 }
    );
  }
}

