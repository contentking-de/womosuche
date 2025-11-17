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
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  message: z.string().min(10),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: "Reiseende muss nach Reisebeginn liegen",
  path: ["endDate"],
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

    // Prüfe ob Owner existiert und E-Mail-Adresse vorhanden ist
    if (!listing.owner) {
      return NextResponse.json(
        { error: "Vermieter nicht gefunden" },
        { status: 404 }
      );
    }

    if (!listing.owner.email) {
      console.error(`Listing ${listing.id} hat keinen Owner mit E-Mail-Adresse`);
      return NextResponse.json(
        { error: "Vermieter-E-Mail nicht verfügbar" },
        { status: 500 }
      );
    }

    // Erstelle Anfrage
    const inquiry = await prisma.inquiry.create({
      data: {
        listingId: validatedData.listingId,
        renterName: validatedData.renterName,
        renterEmail: validatedData.renterEmail,
        startDate: new Date(validatedData.startDate),
        endDate: new Date(validatedData.endDate),
        message: validatedData.message,
      },
    });

    // E-Mails senden (asynchron, nicht blockierend)
    // WICHTIG: Verwende immer listing.owner.email, um sicherzustellen, dass die E-Mail an den richtigen Vermieter geht
    const ownerEmail = listing.owner.email;
    const ownerName = listing.owner.name;
    const inquiryUrl = `${process.env.AUTH_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard/inquiries`;
    
    Promise.all([
      sendNewInquiryEmailToOwner({
        ownerEmail: ownerEmail, // Immer die E-Mail des Owners des angefragten Listings
        ownerName: ownerName,
        listingTitle: listing.title,
        renterName: validatedData.renterName,
        renterEmail: validatedData.renterEmail,
        startDate: validatedData.startDate,
        endDate: validatedData.endDate,
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
        { error: "Ungültige Eingabedaten", details: error.issues },
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

