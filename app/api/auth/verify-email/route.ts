import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    if (!token) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=missing-token`
      );
    }

    // Finde VerificationToken
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=invalid-token`
      );
    }

    // Prüfe ob Token noch gültig ist
    if (verificationToken.expires < new Date()) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=expired-token`
      );
    }

    // Finde User mit dieser E-Mail
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?error=user-not-found`
      );
    }

    // Prüfe ob bereits verifiziert
    if (user.emailVerified) {
      return NextResponse.redirect(
        `${baseUrl}/verify-email?success=already-verified`
      );
    }

    // Verifiziere E-Mail-Adresse
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
      },
    });

    // Lösche VerificationToken nach Bestätigung
    await prisma.verificationToken.delete({
      where: { token },
    });

    // Weiterleitung zur Erfolgsseite
    return NextResponse.redirect(
      `${baseUrl}/verify-email?success=verified`
    );
  } catch (error) {
    console.error("Email verification error:", error);
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${baseUrl}/verify-email?error=verification-failed`
    );
  }
}

