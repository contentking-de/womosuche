import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, rating, message } = body;

    // Validierung
    if (!name || !email || !rating || !message) {
      return NextResponse.json(
        { error: "Alle Felder sind erforderlich" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Bewertung muss zwischen 1 und 5 liegen" },
        { status: 400 }
      );
    }

    // E-Mail-Inhalt erstellen
    const stars = "⭐".repeat(rating);
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
            .rating {
              font-size: 24px;
              margin: 10px 0;
            }
            .field {
              margin: 15px 0;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              margin-top: 5px;
              padding: 10px;
              background-color: white;
              border-left: 3px solid #e03356;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Neues Nutzer-Feedback</h1>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Bewertung:</div>
                <div class="rating">${stars} (${rating}/5)</div>
              </div>
              
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              
              <div class="field">
                <div class="label">E-Mail:</div>
                <div class="value">${email}</div>
              </div>
              
              <div class="field">
                <div class="label">Feedback:</div>
                <div class="value">${message.replace(/\n/g, "<br>")}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // E-Mail senden
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: "feedback@womosuche.de",
      replyTo: email,
      subject: `Neues Feedback von ${name} - ${rating} Sterne`,
      html: emailHtml,
    });

    return NextResponse.json(
      { message: "Feedback erfolgreich gesendet" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error sending feedback email:", error);
    return NextResponse.json(
      { error: "Fehler beim Senden des Feedbacks" },
      { status: 500 }
    );
  }
}

