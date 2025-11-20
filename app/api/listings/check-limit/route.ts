import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkVehicleLimit } from "@/lib/subscription-limits";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Verwende userId aus Query oder Session
    const targetUserId = userId || session.user.id;

    // Prüfe ob User berechtigt ist (nur eigene Limits prüfen, außer Admin)
    if (session.user.role !== "ADMIN" && targetUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    // Nur LANDLORDs haben Limits
    if (session.user.role !== "LANDLORD") {
      return NextResponse.json({
        canCreate: true,
        currentCount: 0,
        maxCount: null,
      });
    }

    const limitCheck = await checkVehicleLimit(targetUserId);

    return NextResponse.json(limitCheck);
  } catch (error) {
    console.error("Error checking vehicle limit:", error);
    // Bei Fehler erlauben wir das Anlegen NICHT (Fail-Closed)
    return NextResponse.json({
      canCreate: false,
      currentCount: 0,
      maxCount: null,
      reason: "Du musst deinen Plan upgraden, um neue Wohnmobile anzulegen.",
    });
  }
}

