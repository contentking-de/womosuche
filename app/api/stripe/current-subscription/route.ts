import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Gibt die aktuelle Subscription des eingeloggten Users zurück
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

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
      });
    }

    return NextResponse.json({
      subscription: {
        stripePriceId: subscription.stripePriceId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      },
    });
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Subscription" },
      { status: 500 }
    );
  }
}

