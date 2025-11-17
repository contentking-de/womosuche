import { Resend } from "resend";
import { NewInquiryToOwnerEmail } from "@/emails/new-inquiry-to-owner";
import { InquiryConfirmationToRenterEmail } from "@/emails/inquiry-confirmation-to-renter";
import { PasswordResetEmail } from "@/emails/password-reset";
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

