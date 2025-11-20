import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import crypto from "crypto";
import { sendEmailVerificationEmail } from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = registerSchema.parse(body);

    // Prüfe ob User bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Ein Benutzer mit dieser E-Mail existiert bereits" },
        { status: 400 }
      );
    }

    // Hash Passwort
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Generiere Verifizierungstoken
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // Token ist 7 Tage gültig

    // Erstelle User (ohne emailVerified)
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: validatedData.name,
        email: validatedData.email,
        password: hashedPassword,
        role: "LANDLORD",
        updatedAt: new Date(),
        emailVerified: null, // Noch nicht verifiziert
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Erstelle VerificationToken
    await prisma.verificationToken.create({
      data: {
        identifier: validatedData.email,
        token: verificationToken,
        expires,
      },
    });

    // Erstelle Bestätigungs-URL
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;

    // Sende Bestätigungs-E-Mail
    try {
      await sendEmailVerificationEmail({
        email: validatedData.email,
        name: validatedData.name,
        verificationUrl,
      });
    } catch (emailError) {
      console.error("Fehler beim Senden der Bestätigungs-E-Mail:", emailError);
      // Lösche User und Token, wenn E-Mail-Versand fehlschlägt
      await prisma.user.delete({ where: { id: user.id } });
      await prisma.verificationToken.delete({ where: { token: verificationToken } });
      return NextResponse.json(
        { error: "Fehler beim Senden der Bestätigungs-E-Mail. Bitte versuchen Sie es später erneut." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: "Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.", 
        requiresVerification: true,
        userId: user.id
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

