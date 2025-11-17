import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const sendSchema = z.object({
  subject: z.string().min(1),
  list: z.enum(["NEWS", "REISEBERICHTE", "VERMIETUNGEN"]),
  content: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Nur ADMINs können Newsletter versenden
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const data = sendSchema.parse(body);

    // Hole alle bestätigten, aktiven Subscriber für diese Liste
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        lists: {
          has: data.list,
        },
        confirmed: true,
        unsubscribedAt: null,
      },
    });

    if (subscribers.length === 0) {
      return NextResponse.json(
        { error: "Keine Empfänger für diese Liste gefunden" },
        { status: 400 }
      );
    }

    let sent = 0;
    let errors: string[] = [];

    // Versende Newsletter an alle Empfänger
    for (const subscriber of subscribers) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: subscriber.email,
          subject: data.subject,
          html: data.content,
        });
        sent++;
      } catch (error) {
        errors.push(`Fehler bei ${subscriber.email}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
      }
    }

    return NextResponse.json({
      sent,
      total: subscribers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Daten", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Newsletter send error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim Versenden" },
      { status: 500 }
    );
  }
}

