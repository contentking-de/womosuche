import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token ist erforderlich"),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = resetPasswordSchema.parse(body);

    // Finde Reset-Token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token: validatedData.token },
    });

    // Prüfe ob Token existiert und noch gültig ist
    if (!resetToken) {
      return NextResponse.json(
        { error: "Ungültiger oder abgelaufener Reset-Token" },
        { status: 400 }
      );
    }

    if (resetToken.expires < new Date()) {
      // Lösche abgelaufenen Token
      await prisma.passwordResetToken.delete({
        where: { token: validatedData.token },
      });
      return NextResponse.json(
        { error: "Der Reset-Token ist abgelaufen. Bitte fordern Sie einen neuen an." },
        { status: 400 }
      );
    }

    // Finde User
    const user = await prisma.user.findUnique({
      where: { email: resetToken.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 }
      );
    }

    // Hash neues Passwort
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Aktualisiere Passwort
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Lösche verwendeten Reset-Token
    await prisma.passwordResetToken.delete({
      where: { token: validatedData.token },
    });

    // Lösche alle anderen Reset-Tokens für diese E-Mail
    await prisma.passwordResetToken.deleteMany({
      where: { email: resetToken.email },
    });

    return NextResponse.json(
      { message: "Passwort wurde erfolgreich zurückgesetzt" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

