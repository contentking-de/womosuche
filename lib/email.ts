import { Resend } from "resend";
import { NewInquiryToOwnerEmail } from "@/emails/new-inquiry-to-owner";
import { InquiryConfirmationToRenterEmail } from "@/emails/inquiry-confirmation-to-renter";
import { PasswordResetEmail } from "@/emails/password-reset";
import { NewsletterConfirmationEmail } from "@/emails/newsletter-confirmation";
import { EmailVerificationEmail } from "@/emails/email-verification";
import { NewListingToAdminEmail } from "@/emails/new-listing-to-admin";
import { NewParkingSubmissionToAdminEmail } from "@/emails/new-parking-submission-to-admin";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewInquiryEmailToOwner({
  ownerEmail,
  ownerName,
  listingTitle,
  renterName,
  renterEmail,
  renterPhone,
  preferredCallTime,
  startDate,
  endDate,
  message,
  inquiryUrl,
}: {
  ownerEmail: string;
  ownerName?: string | null;
  listingTitle: string;
  renterName: string;
  renterEmail: string;
  renterPhone?: string;
  preferredCallTime?: string;
  startDate?: string;
  endDate?: string;
  message: string;
  inquiryUrl: string;
}) {
  try {
    // Validierung: Stelle sicher, dass ownerEmail vorhanden ist
    if (!ownerEmail || !ownerEmail.trim()) {
      throw new Error(`Ungültige E-Mail-Adresse für Vermieter: ${ownerEmail}`);
    }

    const emailHtml = await render(
      NewInquiryToOwnerEmail({
        ownerName: ownerName || undefined,
        listingTitle,
        renterName,
        renterEmail,
        renterPhone,
        preferredCallTime,
        startDate,
        endDate,
        message,
        inquiryUrl,
      })
    );

    // WICHTIG: E-Mail wird immer an die übergebene ownerEmail gesendet
    // Diese sollte immer die E-Mail des Owners des angefragten Wohnmobils sein
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: ownerEmail.trim(), // Verwende trim() um Leerzeichen zu entfernen
      subject: `Neue Buchungsanfrage für ${listingTitle}`,
      html: emailHtml,
    });

    console.log(`E-Mail erfolgreich an Vermieter gesendet: ${ownerEmail} für Listing: ${listingTitle}`);
  } catch (error) {
    console.error(`Fehler beim Senden der E-Mail an Vermieter ${ownerEmail}:`, error);
    throw error;
  }
}

export async function sendInquiryConfirmationToRenter({
  renterEmail,
  renterName,
  listingTitle,
  ownerName,
}: {
  renterEmail: string;
  renterName: string;
  listingTitle: string;
  ownerName?: string | null;
}) {
  try {
    const emailHtml = await render(
      InquiryConfirmationToRenterEmail({
        renterName,
        listingTitle,
        ownerName: ownerName || undefined,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: renterEmail,
      subject: `Ihre Anfrage für ${listingTitle} wurde übermittelt`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error);
    // Nicht werfen, da dies nicht kritisch ist
  }
}

export async function sendPasswordResetEmail({
  email,
  name,
  resetUrl,
}: {
  email: string;
  name?: string;
  resetUrl: string;
}) {
  try {
    if (!email || !email.trim()) {
      throw new Error(`Ungültige E-Mail-Adresse: ${email}`);
    }

    const emailHtml = await render(
      PasswordResetEmail({
        name,
        resetUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email.trim(),
      subject: "Passwort zurücksetzen",
      html: emailHtml,
    });

    console.log(`Passwort-Reset-E-Mail erfolgreich gesendet an: ${email}`);
  } catch (error) {
    console.error(`Fehler beim Senden der Passwort-Reset-E-Mail an ${email}:`, error);
    throw error;
  }
}

export async function sendNewsletterConfirmationEmail({
  email,
  name,
  confirmationUrl,
}: {
  email: string;
  name?: string | null;
  confirmationUrl: string;
}) {
  try {
    if (!email || !email.trim()) {
      throw new Error(`Ungültige E-Mail-Adresse: ${email}`);
    }

    const emailHtml = await render(
      NewsletterConfirmationEmail({
        name: name || undefined,
        confirmationUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email.trim(),
      subject: "Newsletter-Anmeldung bestätigen",
      html: emailHtml,
    });

    console.log(`Newsletter-Bestätigungs-E-Mail erfolgreich gesendet an: ${email}`);
  } catch (error) {
    console.error(`Fehler beim Senden der Newsletter-Bestätigungs-E-Mail an ${email}:`, error);
    throw error;
  }
}

export async function sendEmailVerificationEmail({
  email,
  name,
  verificationUrl,
}: {
  email: string;
  name?: string | null;
  verificationUrl: string;
}) {
  try {
    if (!email || !email.trim()) {
      throw new Error(`Ungültige E-Mail-Adresse: ${email}`);
    }

    const emailHtml = await render(
      EmailVerificationEmail({
        name: name || undefined,
        verificationUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: email.trim(),
      subject: "E-Mail-Adresse bestätigen - womosuche.de",
      html: emailHtml,
    });

    console.log(`E-Mail-Verifizierungs-E-Mail erfolgreich gesendet an: ${email}`);
  } catch (error) {
    console.error(`Fehler beim Senden der E-Mail-Verifizierungs-E-Mail an ${email}:`, error);
    throw error;
  }
}

export async function sendNewListingNotificationToAdmins({
  listingTitle,
  landlordName,
  landlordEmail,
  listingUrl,
}: {
  listingTitle: string;
  landlordName?: string | null;
  landlordEmail: string;
  listingUrl: string;
}) {
  try {
    // Lade alle Admins aus der Datenbank
    const { prisma } = await import("@/lib/prisma");
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.warn("Keine Administratoren gefunden, um Benachrichtigung zu senden");
      return;
    }

    // Sende E-Mail an alle Admins
    const emailPromises = admins.map(async (admin: { email: string | null; name: string | null }) => {
      if (!admin.email || !admin.email.trim()) {
        console.warn(`Admin ohne E-Mail-Adresse übersprungen: ${admin.name || "Unbekannt"}`);
        return;
      }

      try {
        const emailHtml = await render(
          NewListingToAdminEmail({
            adminName: admin.name || undefined,
            listingTitle,
            landlordName: landlordName || undefined,
            landlordEmail,
            listingUrl,
          })
        );

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: admin.email.trim(),
          subject: `Neues Wohnmobil wartet auf Freigabe: ${listingTitle}`,
          html: emailHtml,
        });

        console.log(`Benachrichtigung erfolgreich an Admin gesendet: ${admin.email}`);
      } catch (error) {
        console.error(`Fehler beim Senden der Benachrichtigung an Admin ${admin.email}:`, error);
        // Nicht werfen, damit andere Admins trotzdem benachrichtigt werden
      }
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Fehler beim Senden der Admin-Benachrichtigungen:", error);
    // Nicht werfen, da dies nicht kritisch für das Erstellen des Listings ist
  }
}

export async function sendNewParkingSubmissionNotificationToAdmins({
  parkingTitle,
  location,
  postalCode,
  description,
  submitterName,
  submitterEmail,
  submitterPhone,
  articleUrl,
}: {
  parkingTitle: string;
  location: string;
  postalCode: string;
  description: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone?: string;
  articleUrl: string;
}) {
  try {
    // Lade alle Admins aus der Datenbank
    const { prisma } = await import("@/lib/prisma");
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: {
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      console.warn("Keine Administratoren gefunden, um Benachrichtigung zu senden");
      return;
    }

    // Sende E-Mail an alle Admins
    const emailPromises = admins.map(async (admin: { email: string | null; name: string | null }) => {
      if (!admin.email || !admin.email.trim()) {
        console.warn(`Admin ohne E-Mail-Adresse übersprungen: ${admin.name || "Unbekannt"}`);
        return;
      }

      try {
        const emailHtml = await render(
          NewParkingSubmissionToAdminEmail({
            adminName: admin.name || undefined,
            parkingTitle,
            location,
            postalCode,
            description,
            submitterName,
            submitterEmail,
            submitterPhone,
            articleUrl,
          })
        );

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: admin.email.trim(),
          subject: `Neuer Abstellplatz eingereicht: ${parkingTitle}`,
          html: emailHtml,
        });

        console.log(`Benachrichtigung erfolgreich an Admin gesendet: ${admin.email}`);
      } catch (error) {
        console.error(`Fehler beim Senden der Benachrichtigung an Admin ${admin.email}:`, error);
        // Nicht werfen, damit andere Admins trotzdem benachrichtigt werden
      }
    });

    await Promise.all(emailPromises);
  } catch (error) {
    console.error("Fehler beim Senden der Admin-Benachrichtigungen:", error);
    // Nicht werfen, da dies nicht kritisch für das Erstellen des Artikels ist
  }
}

export async function sendInquiryReplyToRenter({
  renterEmail,
  renterName,
  ownerName,
  ownerEmail,
  listingTitle,
  message,
}: {
  renterEmail: string;
  renterName: string;
  ownerName?: string | null;
  ownerEmail: string;
  listingTitle: string;
  message: string;
}) {
  try {
    if (!renterEmail || !renterEmail.trim()) {
      throw new Error(`Ungültige E-Mail-Adresse für Mieter: ${renterEmail}`);
    }

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
              white-space: pre-wrap;
            }
            .footer {
              margin-top: 20px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Antwort auf Ihre Anfrage</h1>
            </div>
            <div class="content">
              <p>Hallo ${renterName},</p>
              <p>Sie haben eine Antwort von ${ownerName || "dem Vermieter"} bezüglich Ihrer Anfrage für "${listingTitle}" erhalten:</p>
              <div class="message">${message.replace(/\n/g, "<br>")}</div>
              <p style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border-left: 3px solid #ffc107; color: #856404;">
                <strong>Wichtiger Hinweis:</strong> Diese Mail wurde aus dem Vermieter-Bereich von womosuche.de geschrieben. Bitte antworten Sie nicht auf diese Mail, sondern schreiben Sie direkt an ${ownerEmail}.
              </p>
              <div class="footer">
                <p>Mit freundlichen Grüßen<br>Das Team von womosuche.de</p>
                <p style="margin-top: 10px; font-size: 11px; color: #999;">
                  Diese E-Mail wurde von ${ownerName || "dem Vermieter"} (${ownerEmail}) gesendet.
                </p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: renterEmail.trim(),
      replyTo: ownerEmail.trim(),
      subject: `Antwort auf Ihre Anfrage für ${listingTitle}`,
      html: emailHtml,
    });

    console.log(`Antwort-E-Mail erfolgreich an Mieter gesendet: ${renterEmail} für Listing: ${listingTitle}`);
  } catch (error) {
    console.error(`Fehler beim Senden der Antwort-E-Mail an Mieter ${renterEmail}:`, error);
    throw error;
  }
}

