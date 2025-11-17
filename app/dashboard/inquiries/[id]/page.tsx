import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mail, MapPin } from "lucide-react";
import { UpdateInquiryStatusButton } from "@/components/inquiries/update-status-button";

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      listing: {
        include: {
          images: true,
        },
      },
    },
  });

  if (!inquiry) {
    notFound();
  }

  // Prüfe Berechtigung
  if (user.role !== "ADMIN" && inquiry.listing.ownerId !== user.id) {
    redirect("/dashboard/inquiries");
  }

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/inquiries">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zu Anfragen
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Anfrage-Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Anfrage-Informationen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge
                variant={
                  inquiry.status === "OPEN"
                    ? "default"
                    : inquiry.status === "ANSWERED"
                    ? "secondary"
                    : "outline"
                }
                className="mt-1"
              >
                {inquiry.status === "OPEN"
                  ? "Offen"
                  : inquiry.status === "ANSWERED"
                  ? "Beantwortet"
                  : "Archiviert"}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erhalten am</p>
              <p className="mt-1">
                {format(new Date(inquiry.createdAt), "dd.MM.yyyy 'um' HH:mm 'Uhr'", {
                  locale: de,
                })}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Mieter</p>
              <p className="mt-1 font-medium">{inquiry.renterName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">E-Mail</p>
              <a
                href={`mailto:${inquiry.renterEmail}`}
                className="mt-1 text-primary hover:underline flex items-center gap-1"
              >
                <Mail className="h-4 w-4" />
                {inquiry.renterEmail}
              </a>
            </div>
            {inquiry.renterPhone && (
              <div>
                <p className="text-sm text-muted-foreground">Telefonnummer</p>
                <a
                  href={`tel:${inquiry.renterPhone}`}
                  className="mt-1 text-primary hover:underline"
                >
                  {inquiry.renterPhone}
                </a>
              </div>
            )}
            {inquiry.preferredCallTime && (
              <div>
                <p className="text-sm text-muted-foreground">Bevorzugte Rückrufzeit</p>
                <p className="mt-1">{inquiry.preferredCallTime}</p>
              </div>
            )}
            {(inquiry.startDate || inquiry.endDate) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground">Reisezeitraum</p>
                  {inquiry.startDate && (
                    <p className="mt-1">
                      Reisebeginn: {format(new Date(inquiry.startDate), "dd.MM.yyyy", { locale: de })}
                    </p>
                  )}
                  {inquiry.endDate && (
                    <p className="mt-1">
                      Reiseende: {format(new Date(inquiry.endDate), "dd.MM.yyyy", { locale: de })}
                    </p>
                  )}
                </div>
              </>
            )}
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Nachricht</p>
              <p className="mt-2 whitespace-pre-wrap">{inquiry.message}</p>
            </div>
            <div className="pt-4">
              <UpdateInquiryStatusButton inquiry={inquiry} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Wohnmobil</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Link
                href={`/wohnmobile/${inquiry.listing.slug}`}
                className="text-lg font-semibold hover:underline"
              >
                {inquiry.listing.title}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{inquiry.listing.location}</span>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Preis/Tag</p>
                <p className="mt-1 font-semibold">{inquiry.listing.pricePerDay} €</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sitzplätze</p>
                <p className="mt-1 font-semibold">{inquiry.listing.seats}</p>
              </div>
            </div>
            <Link href={`/dashboard/listings/${inquiry.listing.id}`}>
              <Button variant="outline" className="w-full">
                Wohnmobil bearbeiten
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

