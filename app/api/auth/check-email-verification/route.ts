import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const checkEmailSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = checkEmailSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (!user) {
      // User existiert nicht - geben wir keine Information preis (Sicherheit)
      return NextResponse.json({ verified: false });
    }

    return NextResponse.json({ verified: !!user.emailVerified });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten" },
        { status: 400 }
      );
    }
    console.error("Error checking email verification:", error);
    return NextResponse.json(
      { error: "Fehler beim Prüfen der E-Mail-Verifizierung" },
      { status: 500 }
    );
  }
}

