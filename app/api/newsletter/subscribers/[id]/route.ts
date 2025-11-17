import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSubscriberSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse").optional(),
  name: z.string().nullable().optional(),
  lists: z.array(z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"])).min(1, "Mindestens eine Liste erforderlich").optional(),
  confirmed: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Nur ADMINs können Subscriber aktualisieren
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateSubscriberSchema.parse(body);

    // Prüfe ob Subscriber existiert
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!existingSubscriber) {
      return NextResponse.json(
        { error: "Subscriber nicht gefunden" },
        { status: 404 }
      );
    }

    // Wenn E-Mail geändert wird, prüfe ob neue E-Mail bereits existiert
    if (data.email && data.email.toLowerCase().trim() !== existingSubscriber.email) {
      const emailExists = await prisma.newsletterSubscriber.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Ein Subscriber mit dieser E-Mail existiert bereits" },
          { status: 400 }
        );
      }
    }

    // Bereite Update-Daten vor
    const updateData: any = {};
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.name !== undefined) updateData.name = data.name;
    if (data.lists) updateData.lists = data.lists;
    if (data.confirmed !== undefined) {
      updateData.confirmed = data.confirmed;
      if (data.confirmed && !existingSubscriber.confirmed) {
        updateData.confirmedAt = new Date();
      }
      if (!data.confirmed) {
        updateData.confirmedAt = null;
      }
    }

    // Aktualisiere Subscriber
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(
      { message: "Subscriber erfolgreich aktualisiert", subscriber },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Update subscriber error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Nur ADMINs können Subscriber löschen
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Prüfe ob Subscriber existiert
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber nicht gefunden" },
        { status: 404 }
      );
    }

    // Lösche Subscriber
    await prisma.newsletterSubscriber.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Subscriber erfolgreich gelöscht" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete subscriber error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

