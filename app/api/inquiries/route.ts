import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  sendNewInquiryEmailToOwner,
  sendInquiryConfirmationToRenter,
} from "@/lib/email";

const inquirySchema = z.object({
  listingId: z.string(),
  renterName: z.string().min(2),
  renterEmail: z.string().email(),
  message: z.string().min(10),
});

// Einfaches Rate Limiting (in-memory)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 Stunde
    return true;
  }

  if (limit.count >= 5) {
    // Max 5 Anfragen pro Stunde
    return false;
  }

  limit.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // Rate Limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = inquirySchema.parse(body);

    // Prüfe ob Listing existiert und veröffentlicht ist
    const listing = await prisma.listing.findUnique({
      where: { id: validatedData.listingId },
      include: {
        owner: true,
      },
    });

    if (!listing) {
      return NextResponse.json(
        { error: "Wohnmobil nicht gefunden" },
        { status: 404 }
      );
    }

    if (!listing.published) {
      return NextResponse.json(
        { error: "Wohnmobil nicht verfügbar" },
        { status: 404 }
      );
    }

    // Erstelle Anfrage
    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: validatedData.listingId,
        renterName: validatedData.renterName,
        renterEmail: validatedData.renterEmail,
        message: validatedData.message,
      },
    });

    // E-Mails senden (asynchron, nicht blockierend)
    const inquiryUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/inquiries`;
    
    Promise.all([
      sendNewInquiryEmailToOwner({
        ownerEmail: listing.owner.email,
        ownerName: listing.owner.name,
        listingTitle: listing.title,
        renterName: validatedData.renterName,
        renterEmail: validatedData.renterEmail,
        message: validatedData.message,
        inquiryUrl,
      }),
      sendInquiryConfirmationToRenter({
        renterEmail: validatedData.renterEmail,
        renterName: validatedData.renterName,
        listingTitle: listing.title,
        ownerName: listing.owner.name,
      }),
    ]).catch((error) => {
      console.error("Error sending emails:", error);
      // Nicht werfen, da Anfrage bereits erstellt wurde
    });

    return NextResponse.json(
      { message: "Anfrage erfolgreich gesendet", inquiry },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Create inquiry error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

