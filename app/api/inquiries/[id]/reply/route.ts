import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendInquiryReplyToRenter } from "@/lib/email";

const replyInquirySchema = z.object({
  message: z.string().min(1, "Nachricht darf nicht leer sein"),
  template: z.enum(["confirmed", "rejected", "upsell"]).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        Listing: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    if (!inquiry.Listing) {
      return NextResponse.json({ error: "Wohnmobil nicht gefunden" }, { status: 404 });
    }

    // Prüfe Berechtigung
    if (
      session.user.role !== "ADMIN" &&
      inquiry.Listing.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = replyInquirySchema.parse(body);

    // Prüfe ob ownerEmail vorhanden ist
    const ownerEmail = inquiry.Listing.User.email || session.user.email;
    if (!ownerEmail) {
      return NextResponse.json(
        { error: "E-Mail-Adresse des Vermieters nicht gefunden" },
        { status: 400 }
      );
    }

    // Sende E-Mail an Mieter
    try {
      await sendInquiryReplyToRenter({
        renterEmail: inquiry.renterEmail,
        renterName: inquiry.renterName,
        ownerName: inquiry.Listing.User.name,
        ownerEmail: ownerEmail,
        listingTitle: inquiry.Listing.title,
        message: validatedData.message,
      });
    } catch (emailError) {
      console.error("Error sending reply email:", emailError);
      const emailErrorMessage = emailError instanceof Error ? emailError.message : "Unbekannter E-Mail-Fehler";
      // E-Mail-Fehler nicht weiterwerfen, aber loggen
      console.error("E-Mail konnte nicht gesendet werden:", emailErrorMessage);
    }

    // Aktualisiere Status auf "ANSWERED" wenn noch nicht gesetzt und speichere Antwort-Informationen
    const updateData = {
      status: inquiry.status === "OPEN" ? "ANSWERED" : inquiry.status,
      replySentAt: new Date(),
      replyTemplate: validatedData.template || null,
    };

    console.log("Updating inquiry with data:", updateData);

    await prisma.inquiry.update({
      where: { id },
      data: updateData,
    });

    console.log("Inquiry updated successfully");

    return NextResponse.json({ message: "Antwort erfolgreich gesendet" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Reply inquiry error:", error);
    const errorMessage = error instanceof Error ? error.message : "Ein Fehler ist aufgetreten";
    return NextResponse.json(
      { error: errorMessage, details: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    );
  }
}

