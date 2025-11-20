import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount: number;
  currency: string;
  date: string;
  periodStart: string | null;
  periodEnd: string | null;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
  description: string;
}

async function getInvoices(userId: string): Promise<Invoice[]> {
  try {
    // Hole Subscription mit Stripe Customer ID
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription || !subscription.stripeCustomerId) {
      return [];
    }

    // Hole alle Invoices für diesen Customer von Stripe
    const invoices = await stripe.invoices.list({
      customer: subscription.stripeCustomerId,
      limit: 100, // Hole die letzten 100 Rechnungen
    });

    // Formatiere die Invoices für die Anzeige
    return invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status || "unknown",
      amount: invoice.amount_paid / 100, // Konvertiere von Cent zu Euro
      currency: invoice.currency.toUpperCase(),
      date: new Date(invoice.created * 1000).toISOString(),
      periodStart: invoice.period_start ? new Date(invoice.period_start * 1000).toISOString() : null,
      periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000).toISOString() : null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
      invoicePdf: invoice.invoice_pdf || null,
      description: invoice.description || invoice.lines.data[0]?.description || "Abonnement",
    }));
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return [];
  }
}

export default async function RechnungenPage() {
  const user = await requireAuth();

  // Nur LANDLORDs können Rechnungen sehen
  if (user.role !== "LANDLORD") {
    return (
      <div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Zugriff verweigert</AlertTitle>
          <AlertDescription>
            Diese Seite ist nur für Vermieter verfügbar.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const invoices = await getInvoices(user.id);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd.MM.yyyy", { locale: de });
    } catch {
      return "N/A";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === "EUR" ? "€" : currency;
    return `${amount.toFixed(2)} ${symbol}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <span className="text-green-600 font-medium">Bezahlt</span>;
      case "open":
        return <span className="text-yellow-600 font-medium">Offen</span>;
      case "draft":
        return <span className="text-gray-600 font-medium">Entwurf</span>;
      case "void":
        return <span className="text-red-600 font-medium">Storniert</span>;
      default:
        return <span className="text-gray-600">{status}</span>;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Rechnungen</h1>
        <p className="mt-2 text-muted-foreground">
          Laden Sie Ihre Rechnungen für die Buchhaltung herunter
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ihre Rechnungen</CardTitle>
          <CardDescription>
            Alle Rechnungen für Ihr Abonnement
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Noch keine Rechnungen vorhanden.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rechnungsnummer</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>Zeitraum</TableHead>
                    <TableHead>Betrag</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.number || invoice.id.slice(-8)}
                      </TableCell>
                      <TableCell>{formatDate(invoice.date)}</TableCell>
                      <TableCell>
                        {invoice.periodStart && invoice.periodEnd ? (
                          <span className="text-sm text-muted-foreground">
                            {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {invoice.description}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.invoicePdf && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={invoice.invoicePdf}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                              >
                                <Download className="mr-2 h-4 w-4" />
                                PDF
                              </a>
                            </Button>
                          )}
                          {invoice.hostedInvoiceUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <a
                                href={invoice.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                Ansehen
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

