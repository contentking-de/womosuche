import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      );
    }

    // Nur LANDLORDs können ihre Rechnungen sehen
    if (session.user.role !== "LANDLORD") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    // Hole Subscription mit Stripe Customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return NextResponse.json({
        invoices: [],
        message: "Keine Subscription gefunden",
      });
    }

    // Hole alle Invoices für diesen Customer von Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 100, // Hole die letzten 100 Rechnungen
    });

    // Formatiere die Invoices für die Anzeige
    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid / 100, // Konvertiere von Cent zu Euro
      currency: invoice.currency.toUpperCase(),
      date: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
      description: invoice.description || invoice.lines.data[0]?.description || "Abonnement",
    }));

    return NextResponse.json({
      invoices: formattedInvoices,
    });
  } catch (error) {
    console.error("Error fetching Stripe invoices:", error);
    return NextResponse.json(
      { 
        error: "Fehler beim Abrufen der Rechnungen",
        details: error instanceof Error ? error.message : "Unbekannter Fehler"
      },
      { status: 500 }
    );
  }
}

