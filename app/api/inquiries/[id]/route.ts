import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateInquirySchema = z.object({
  status: z.enum(["OPEN", "ANSWERED", "ARCHIVED"]),
});

export async function PATCH(
  request: Request,
  { params }: any
) {
  try {
    const idParam = params?.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Anfrage nicht gefunden" }, { status: 404 });
    }

    // Prüfe Berechtigung
    if (
      session.user.role !== "ADMIN" &&
      inquiry.listing.ownerId !== session.user.id
    ) {
      return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateInquirySchema.parse(body);

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: {
        status: validatedData.status,
      },
    });

    return NextResponse.json(updatedInquiry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Update inquiry error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

