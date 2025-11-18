import { Resend } from "resend";
import { NewInquiryToOwnerEmail } from "@/emails/new-inquiry-to-owner";
import { InquiryConfirmationToRenterEmail } from "@/emails/inquiry-confirmation-to-renter";
import { PasswordResetEmail } from "@/emails/password-reset";
import { NewsletterConfirmationEmail } from "@/emails/newsletter-confirmation";
import { EmailVerificationEmail } from "@/emails/email-verification";
import { NewListingToAdminEmail } from "@/emails/new-listing-to-admin";
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
    const emailPromises = admins.map(async (admin) => {
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

