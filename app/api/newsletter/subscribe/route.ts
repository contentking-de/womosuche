import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import crypto from "crypto";
import { sendNewsletterConfirmationEmail } from "@/lib/email";

const subscribeSchema = z.object({
  email: z.string().email(),
  name: z.string().nullable().optional(),
  lists: z.array(z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"])).min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = subscribeSchema.parse(body);

    const normalizedEmail = data.email.toLowerCase().trim();

    // Prüfe, ob bereits ein Subscriber mit dieser E-Mail existiert
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalizedEmail },
    });

    // Generiere Bestätigungstoken
    const confirmationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token ist 7 Tage gültig

    // Erstelle Bestätigungs-URL
    const confirmationUrl = `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/newsletter/confirm?token=${confirmationToken}`;

    if (existingSubscriber) {
      // Aktualisiere bestehenden Subscriber
      // Füge neue Listen hinzu, wenn sie noch nicht vorhanden sind
      const updatedLists = Array.from(
        new Set([...existingSubscriber.lists, ...data.lists])
      );

      // Wenn der Subscriber abgemeldet war oder noch nicht bestätigt, setze ihn auf unbestätigt
      const needsConfirmation = !existingSubscriber.confirmed || !!existingSubscriber.unsubscribedAt;

      const updateData: any = {
        lists: updatedLists,
        name: data.name || existingSubscriber.name,
        confirmationToken,
        confirmationTokenExpires: expiresAt,
      };

      if (existingSubscriber.unsubscribedAt) {
        updateData.unsubscribedAt = null;
        updateData.confirmed = false; // Erfordert neue Bestätigung
      }

      if (needsConfirmation) {
        updateData.confirmed = false;
      }

      await prisma.newsletterSubscriber.update({
        where: { email: normalizedEmail },
        data: updateData,
      });

      // Sende Bestätigungs-E-Mail nur wenn Bestätigung erforderlich ist
      if (needsConfirmation) {
        try {
          await sendNewsletterConfirmationEmail({
            email: normalizedEmail,
            name: data.name || existingSubscriber.name,
            confirmationUrl,
          });
        } catch (emailError) {
          console.error("Fehler beim Senden der Bestätigungs-E-Mail:", emailError);
          // Wir werfen den Fehler nicht, da der Subscriber bereits erstellt wurde
        }
      }

      return NextResponse.json({
        message: "Newsletter-Abonnement aktualisiert",
        requiresConfirmation: needsConfirmation,
      });
    } else {
      // Erstelle neuen Subscriber
      await prisma.newsletterSubscriber.create({
        data: {
          email: normalizedEmail,
          name: data.name || null,
          lists: data.lists,
          confirmed: false, // Erfordert Bestätigung per E-Mail
          confirmationToken,
          confirmationTokenExpires: expiresAt,
        },
      });

      // Sende Bestätigungs-E-Mail
      try {
        await sendNewsletterConfirmationEmail({
          email: normalizedEmail,
          name: data.name || undefined,
          confirmationUrl,
        });
      } catch (emailError) {
        console.error("Fehler beim Senden der Bestätigungs-E-Mail:", emailError);
        // Lösche den Subscriber, wenn E-Mail-Versand fehlschlägt
        await prisma.newsletterSubscriber.delete({
          where: { email: normalizedEmail },
        });
        return NextResponse.json(
          { error: "Fehler beim Senden der Bestätigungs-E-Mail. Bitte versuchen Sie es später erneut." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: "Newsletter-Abonnement erfolgreich erstellt",
        requiresConfirmation: true,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

