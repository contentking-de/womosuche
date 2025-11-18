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
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Mail, Phone, Clock } from "lucide-react";
import { UpdateInquiryStatusButton } from "@/components/inquiries/update-status-button";
import type { Inquiry } from "@prisma/client";

export default async function InquiriesPage() {
  const user = await requireAuth();

  const inquiries = (await prisma.inquiry.findMany({
    where:
      user.role === "ADMIN"
        ? {}
        : {
            Listing: {
              ownerId: user.id,
            },
          },
    include: {
      Listing: {
        select: {
          id: true,
          title: true,
          slug: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as (Inquiry & { Listing: { id: string; title: string; slug: string } })[];

  const statusCounts = {
    OPEN: inquiries.filter((i) => i.status === "OPEN").length,
    ANSWERED: inquiries.filter((i) => i.status === "ANSWERED").length,
    ARCHIVED: inquiries.filter((i) => i.status === "ARCHIVED").length,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Buchungsanfragen</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Ihre Buchungsanfragen
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
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
              <TableHead>Datum</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">Noch keine Anfragen vorhanden</p>
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry: Inquiry & { Listing: { id: string; title: string; slug: string } }) => (
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

