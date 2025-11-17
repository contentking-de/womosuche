import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSubscriberSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
  name: z.string().nullable().optional(),
  lists: z.array(z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"])).min(1, "Mindestens eine Liste erforderlich"),
  confirmed: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Nur ADMINs können Subscriber erstellen
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = createSubscriberSchema.parse(body);

    const normalizedEmail = data.email.toLowerCase().trim();

    // Prüfe ob bereits ein Subscriber mit dieser E-Mail existiert
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingSubscriber) {
      return NextResponse.json(
        { error: "Ein Subscriber mit dieser E-Mail existiert bereits" },
        { status: 400 }
      );
    }

    // Erstelle neuen Subscriber
    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email: normalizedEmail,
        name: data.name || null,
        lists: data.lists,
        confirmed: data.confirmed,
        confirmedAt: data.confirmed ? new Date() : null,
      },
    });

    return NextResponse.json(
      { message: "Subscriber erfolgreich erstellt", subscriber },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create subscriber error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

