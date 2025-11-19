import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { z } from "zod";

const resend = new Resend(process.env.RESEND_API_KEY);

const contactSchema = z.object({
  subject: z.string().min(1),
  message: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    // Nur ADMINs können kontaktieren
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Hole die Vermietung
    const place = await prisma.outreachPlace.findUnique({
      where: { id },
    });

    if (!place) {
      return NextResponse.json(
        { error: "Vermietung nicht gefunden" },
        { status: 404 }
      );
    }

    // Bestimme E-Mail-Adresse
    let emailTo: string | null = null;
    
    if (place.email) {
      emailTo = place.email;
    } else if (place.website) {
      // Versuche E-Mail aus Website zu extrahieren oder verwende Kontaktformular
      // Für jetzt verwenden wir eine generische Kontakt-E-Mail
      // In der Praxis könnte man hier die Website crawlen oder ein Kontaktformular verwenden
      emailTo = null; // Keine direkte E-Mail verfügbar
    }

    // Wenn keine E-Mail verfügbar ist, speichere nur die Notizen
    if (!emailTo) {
      await prisma.outreachPlace.update({
        where: { id },
        data: {
          contacted: true,
          contactedAt: new Date(),
          contactNotes: data.notes || `Kontaktversuch: ${data.subject}`,
        },
      });

      return NextResponse.json({
        message: "Kontaktinformationen gespeichert (keine E-Mail-Adresse verfügbar)",
        emailSent: false,
      });
    }

    // Sende E-Mail
    try {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                background-color: #e03356;
                color: white;
                padding: 20px;
                text-align: center;
              }
              .content {
                padding: 20px;
                background-color: #f9f9f9;
              }
              .message {
                margin: 20px 0;
                padding: 15px;
                background-color: white;
                border-left: 3px solid #e03356;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Anfrage von womosuche.de</h1>
              </div>
              <div class="content">
                <p>Sehr geehrte Damen und Herren,</p>
                <div class="message">
                  ${data.message.replace(/\n/g, "<br>")}
                </div>
                <p>Mit freundlichen Grüßen<br>Das Team von womosuche.de</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: emailTo,
        subject: data.subject,
        html: emailHtml,
        replyTo: session.user.email,
      });

      // Aktualisiere Status
      await prisma.outreachPlace.update({
        where: { id },
        data: {
          contacted: true,
          contactedAt: new Date(),
          contactNotes: data.notes || `E-Mail gesendet: ${data.subject}`,
        },
      });

      return NextResponse.json({
        message: "E-Mail erfolgreich gesendet",
        emailSent: true,
      });
    } catch (emailError) {
      console.error("E-Mail-Versand Fehler:", emailError);
      
      // Speichere trotzdem den Kontaktversuch
      await prisma.outreachPlace.update({
        where: { id },
        data: {
          contacted: true,
          contactedAt: new Date(),
          contactNotes: data.notes || `E-Mail-Versand fehlgeschlagen: ${data.subject}`,
        },
      });

      return NextResponse.json(
        { 
          error: "E-Mail konnte nicht gesendet werden",
          details: emailError instanceof Error ? emailError.message : "Unbekannter Fehler",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Outreach contact error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

