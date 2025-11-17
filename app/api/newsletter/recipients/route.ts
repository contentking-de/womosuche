import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    // Nur ADMINs können Empfängeranzahl abrufen
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const list = searchParams.get("list");

    if (!list || !["NEWS", "REISEBERICHTE", "VERMIETUNGEN"].includes(list)) {
      return NextResponse.json(
        { error: "Ungültige Liste" },
        { status: 400 }
      );
    }

    // Zähle bestätigte, aktive Subscriber für diese Liste
    const count = await prisma.newsletterSubscriber.count({
      where: {
        lists: {
          has: list as "NEWS" | "REISEBERICHTE" | "VERMIETUNGEN",
        },
        confirmed: true,
        unsubscribedAt: null,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error("Recipients count error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

