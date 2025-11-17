import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/?error=missing-token`
      );
    }

    // Finde Subscriber mit diesem Token
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { confirmationToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(
        `${baseUrl}/?error=invalid-token`
      );
    }

    // Prüfe ob Token noch gültig ist
    if (
      !subscriber.confirmationTokenExpires ||
      subscriber.confirmationTokenExpires < new Date()
    ) {
      return NextResponse.redirect(
        `${baseUrl}/?error=expired-token`
      );
    }

    // Prüfe ob bereits bestätigt
    if (subscriber.confirmed) {
      return NextResponse.redirect(
        `${baseUrl}/?success=already-confirmed`
      );
    }

    // Bestätige den Subscriber
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        confirmed: true,
        confirmedAt: new Date(),
        confirmationToken: null, // Lösche Token nach Bestätigung
        confirmationTokenExpires: null,
      },
    });

    // Weiterleitung zur Erfolgsseite
    return NextResponse.redirect(
      `${baseUrl}/?success=newsletter-confirmed`
    );
  } catch (error) {
    console.error("Newsletter confirmation error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/?error=confirmation-failed`
    );
  }
}

