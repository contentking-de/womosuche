import { Resend } from "resend";
import { NewInquiryToOwnerEmail } from "@/emails/new-inquiry-to-owner";
import { InquiryConfirmationToRenterEmail } from "@/emails/inquiry-confirmation-to-renter";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendNewInquiryEmailToOwner({
  ownerEmail,
  ownerName,
  listingTitle,
  renterName,
  renterEmail,
  message,
  inquiryUrl,
}: {
  ownerEmail: string;
  ownerName?: string | null;
  listingTitle: string;
  renterName: string;
  renterEmail: string;
  message: string;
  inquiryUrl: string;
}) {
  try {
    const emailHtml = await render(
      NewInquiryToOwnerEmail({
        ownerName: ownerName || undefined,
        listingTitle,
        renterName,
        renterEmail,
        message,
        inquiryUrl,
      })
    );

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
      to: ownerEmail,
      subject: `Neue Buchungsanfrage für ${listingTitle}`,
      html: emailHtml,
    });
  } catch (error) {
    console.error("Error sending email to owner:", error);
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

