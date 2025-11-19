import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Mail, Phone, Clock, Search } from "lucide-react";
import { UpdateInquiryStatusButton } from "@/components/inquiries/update-status-button";
import { ReplyToInquiryButton } from "@/components/inquiries/reply-to-inquiry-button";
import type { Inquiry } from "@prisma/client";

export default async function InquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireAuth();
  const params = await searchParams;
  const q = (params?.q || "").trim();
  const status = params?.status;

  // Baue WHERE-Bedingung auf
  const whereConditions: any[] = [];

  // Basis-Filter: Nur eigene Inquiries für LANDLORD
  if (user.role !== "ADMIN") {
    whereConditions.push({
      Listing: {
        ownerId: user.id,
      },
    });
  }

  // Suchfilter
  if (q.length > 0) {
    whereConditions.push({
      OR: [
        { renterName: { contains: q, mode: "insensitive" as const } },
        { renterEmail: { contains: q, mode: "insensitive" as const } },
        { message: { contains: q, mode: "insensitive" as const } },
        { renterPhone: { contains: q, mode: "insensitive" as const } },
        {
          Listing: {
            title: { contains: q, mode: "insensitive" as const },
          },
        },
      ],
    });
  }

  // Status-Filter
  if (status && ["OPEN", "ANSWERED", "ARCHIVED"].includes(status)) {
    whereConditions.push({ status });
  }

  // Kombiniere alle Bedingungen
  const where =
    whereConditions.length > 0
      ? { AND: whereConditions }
      : user.role !== "ADMIN"
      ? {
          Listing: {
            ownerId: user.id,
          },
        }
      : {};

  const inquiries = (await prisma.inquiry.findMany({
    where,
    include: {
      Listing: {
        include: {
          User: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as (Inquiry & { Listing: { id: string; title: string; slug: string; User: { name: string | null } } })[];

  // Status-Counts basierend auf allen Anfragen (nicht gefiltert)
  const allInquiriesWhere =
    user.role === "ADMIN"
      ? {}
      : {
          Listing: {
            ownerId: user.id,
          },
        };

  const allInquiries = await prisma.inquiry.findMany({
    where: allInquiriesWhere,
    select: { 
      status: true,
      replyTemplate: true,
      replySentAt: true,
    },
  });

  const statusCounts = {
    OPEN: allInquiries.filter((i: { status: string }) => i.status === "OPEN").length,
    ANSWERED: allInquiries.filter((i: { status: string }) => i.status === "ANSWERED").length,
    ARCHIVED: allInquiries.filter((i: { status: string }) => i.status === "ARCHIVED").length,
  };

  // Antwort-Statistiken
  const repliedInquiries = allInquiries.filter((i: { replySentAt: Date | null }) => i.replySentAt !== null);
  const replyStats = {
    total: repliedInquiries.length,
    confirmed: repliedInquiries.filter((i: { replyTemplate: string | null }) => i.replyTemplate === "confirmed").length,
    rejected: repliedInquiries.filter((i: { replyTemplate: string | null }) => i.replyTemplate === "rejected").length,
    upsell: repliedInquiries.filter((i: { replyTemplate: string | null }) => i.replyTemplate === "upsell").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Buchungsanfragen</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Ihre Buchungsanfragen
        </p>
      </div>

      {/* Such- und Filter-Bereich */}
      <form action="/dashboard/inquiries" method="get" className="mb-6 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Mieter, E-Mail, Wohnmobil oder Nachricht suchen…"
            defaultValue={q}
            className="pl-9"
          />
        </div>
        <Select name="status" defaultValue={status || "all"}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="OPEN">Offen</SelectItem>
            <SelectItem value="ANSWERED">Beantwortet</SelectItem>
            <SelectItem value="ARCHIVED">Archiviert</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          <Search className="mr-2 h-4 w-4" />
          Suchen
        </Button>
        {(q || status) && (
          <Link href="/dashboard/inquiries">
            <Button type="button" variant="ghost">
              Zurücksetzen
            </Button>
          </Link>
        )}
      </form>

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offen</CardDescription>
            <CardTitle className="text-2xl">{statusCounts.OPEN}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Beantwortet</CardDescription>
            <CardTitle className="text-2xl">{statusCounts.ANSWERED}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Archiviert</CardDescription>
            <CardTitle className="text-2xl">{statusCounts.ARCHIVED}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Antworten gesendet</CardDescription>
            <CardTitle className="text-2xl">{replyStats.total}</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bestätigt:</span>
                <span className="font-medium">{replyStats.confirmed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abgelehnt:</span>
                <span className="font-medium">{replyStats.rejected}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Upsell:</span>
                <span className="font-medium">{replyStats.upsell}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wohnmobil</TableHead>
              <TableHead>Mieter</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Rückrufzeit</TableHead>
              <TableHead>Nachricht</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Antwort</TableHead>
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <p className="text-muted-foreground">
                    {q || status
                      ? "Keine Anfragen gefunden, die den Filterkriterien entsprechen"
                      : "Noch keine Anfragen vorhanden"}
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry: Inquiry & { Listing: { id: string; title: string; slug: string; User: { name: string | null } } }) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/wohnmobile/${inquiry.Listing.slug}`}
                      className="hover:underline"
                    >
                      {inquiry.Listing.title}
                    </Link>
                  </TableCell>
                  <TableCell>{inquiry.renterName}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${inquiry.renterEmail}`}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Mail className="h-3 w-3" />
                      {inquiry.renterEmail}
                    </a>
                  </TableCell>
                  <TableCell>
                    {inquiry.renterPhone ? (
                      <a
                        href={`tel:${inquiry.renterPhone}`}
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {inquiry.renterPhone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {inquiry.preferredCallTime ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{inquiry.preferredCallTime}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate">{inquiry.message}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inquiry.status === "OPEN"
                          ? "default"
                          : inquiry.status === "ANSWERED"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {inquiry.status === "OPEN"
                        ? "Offen"
                        : inquiry.status === "ANSWERED"
                        ? "Beantwortet"
                        : "Archiviert"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inquiry.replySentAt ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {inquiry.replyTemplate === "confirmed"
                            ? "Bestätigt"
                            : inquiry.replyTemplate === "rejected"
                            ? "Abgelehnt"
                            : inquiry.replyTemplate === "upsell"
                            ? "Upsell/Alternative"
                            : "Manuell"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(inquiry.replySentAt), "dd.MM.yyyy HH:mm", {
                            locale: de,
                          })}
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {format(new Date(inquiry.createdAt), "dd.MM.yyyy HH:mm", {
                      locale: de,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/inquiries/${inquiry.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <ReplyToInquiryButton 
                        inquiry={{
                          ...inquiry,
                          renterName: inquiry.renterName,
                          renterEmail: inquiry.renterEmail,
                        }}
                        ownerName={inquiry.Listing.User.name || user.name || "womosuche.de"}
                      />
                      <UpdateInquiryStatusButton inquiry={inquiry} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

