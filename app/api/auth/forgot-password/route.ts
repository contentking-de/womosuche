import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ungültige E-Mail-Adresse"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = forgotPasswordSchema.parse(body);

    // Prüfe ob User existiert
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    // Aus Sicherheitsgründen geben wir immer die gleiche Antwort,
    // auch wenn der User nicht existiert
    if (!user) {
      return NextResponse.json(
        { message: "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet." },
        { status: 200 }
      );
    }

    // Generiere Reset-Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token ist 1 Stunde gültig

    // Lösche alte Reset-Tokens für diese E-Mail
    await prisma.passwordResetToken.deleteMany({
      where: { email: validatedData.email },
    });

    // Erstelle neuen Reset-Token
    await prisma.passwordResetToken.create({
      data: {
        email: validatedData.email,
        token: resetToken,
        expires: expiresAt,
      },
    });

    // Sende E-Mail mit Reset-Link
    const resetUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`;
    
    try {
      await sendPasswordResetEmail({
        email: validatedData.email,
        name: user.name || undefined,
        resetUrl,
      });
    } catch (emailError) {
      console.error("Fehler beim Senden der E-Mail:", emailError);
      // Lösche den Token, wenn E-Mail-Versand fehlschlägt
      await prisma.passwordResetToken.deleteMany({
        where: { email: validatedData.email },
      });
      return NextResponse.json(
        { error: "Fehler beim Senden der E-Mail. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail mit Anweisungen zum Zurücksetzen des Passworts gesendet." },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

