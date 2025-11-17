import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import type { NewsletterSubscriber } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Mail, Upload, Send, Search, X, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { NewsletterActions } from "@/components/newsletter/newsletter-actions";
import { NewsletterCreateButton } from "@/components/newsletter/newsletter-create-button";

const ITEMS_PER_PAGE = 50;

export default async function NewsletterPage({
  searchParams,
}: {
  searchParams: Promise<{ list?: string; status?: string; q?: string; page?: string }>;
}) {
  await requireAdmin();

  const params = await searchParams;
  const listFilter = params?.list;
  const statusFilter = params?.status;
  const searchQuery = (params?.q || "").trim();
  const page = parseInt(params?.page || "1", 10);
  const skip = (page - 1) * ITEMS_PER_PAGE;

  // Baue WHERE-Bedingung für Filter auf
  const whereConditions: any[] = [];

  // Listen-Filter
  if (listFilter && ["NEWS", "REISEBERICHTE", "VERMIETUNGEN"].includes(listFilter)) {
    whereConditions.push({
      lists: {
        has: listFilter,
      },
    });
  }

  // Status-Filter
  if (statusFilter === "confirmed") {
    whereConditions.push({
      confirmed: true,
      unsubscribedAt: null,
    });
  } else if (statusFilter === "unconfirmed") {
    whereConditions.push({
      confirmed: false,
      unsubscribedAt: null,
    });
  } else if (statusFilter === "unsubscribed") {
    whereConditions.push({
      unsubscribedAt: { not: null },
    });
  }

  // Suchfilter (E-Mail oder Name)
  if (searchQuery.length > 0) {
    whereConditions.push({
      OR: [
        { email: { contains: searchQuery, mode: "insensitive" as const } },
        { name: { contains: searchQuery, mode: "insensitive" as const } },
      ],
    });
  }

  const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

  const [subscribers, stats, totalCount, activeCount, listStats, filteredCount] = await Promise.all([
    // Gefilterte Subscriber für die Tabelle (mit Pagination)
    prisma.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    // Statistiken für bestätigt/unbestätigt
    prisma.newsletterSubscriber.groupBy({
      by: ["confirmed"],
      _count: true,
    }),
    // Gesamtanzahl aller Subscriber
    prisma.newsletterSubscriber.count(),
    // Anzahl aktiver Subscriber (nicht abgemeldet)
    prisma.newsletterSubscriber.count({
      where: {
        unsubscribedAt: null,
      },
    }),
    // Statistiken für Listen (alle Subscriber, nicht nur die letzten 50)
    Promise.all([
      prisma.newsletterSubscriber.count({
        where: {
          lists: {
            has: "NEWS",
          },
        },
      }),
      prisma.newsletterSubscriber.count({
        where: {
          lists: {
            has: "REISEBERICHTE",
          },
        },
      }),
      prisma.newsletterSubscriber.count({
        where: {
          lists: {
            has: "VERMIETUNGEN",
          },
        },
      }),
    ]),
    // Anzahl gefilterter Subscriber
    prisma.newsletterSubscriber.count({
      where,
    }),
  ]);

  const confirmedCount = stats.find((s: { confirmed: boolean; _count: number }) => s.confirmed)?._count || 0;
  const unconfirmedCount = stats.find((s: { confirmed: boolean; _count: number }) => !s.confirmed)?._count || 0;

  const listCounts = {
    NEWS: listStats[0],
    REISEBERICHTE: listStats[1],
    VERMIETUNGEN: listStats[2],
  };

  const totalPages = Math.ceil(filteredCount / ITEMS_PER_PAGE);

  // Erstelle URL-Parameter für Pagination-Links
  const createPageUrl = (newPage: number) => {
    const searchParams = new URLSearchParams();
    if (listFilter && listFilter !== "all") searchParams.set("list", listFilter);
    if (statusFilter && statusFilter !== "all") searchParams.set("status", statusFilter);
    if (searchQuery) searchParams.set("q", searchQuery);
    if (newPage > 1) searchParams.set("page", newPage.toString());
    const queryString = searchParams.toString();
    return `/dashboard/newsletter${queryString ? `?${queryString}` : ""}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Newsletter-Verwaltung</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Newsletter-Subscriber und versenden Sie Newsletter
          </p>
        </div>
        <div className="flex gap-2">
          <NewsletterCreateButton />
          <Link href="/dashboard/newsletter/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              CSV Import
            </Button>
          </Link>
          <Link href="/dashboard/newsletter/send">
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Newsletter versenden
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistiken */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Gesamt Subscriber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bestätigt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{confirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unbestätigt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{unconfirmedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Aktiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {activeCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listen-Statistiken */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">News</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listCounts.NEWS}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reiseberichte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listCounts.REISEBERICHTE}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vermietungen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listCounts.VERMIETUNGEN}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form action="/dashboard/newsletter" method="get" className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                placeholder="E-Mail oder Name suchen…"
                defaultValue={searchQuery}
                className="pl-9"
              />
            </div>
            <Select name="list" defaultValue={listFilter || "all"}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Liste" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Listen</SelectItem>
                <SelectItem value="NEWS">News</SelectItem>
                <SelectItem value="REISEBERICHTE">Reiseberichte</SelectItem>
                <SelectItem value="VERMIETUNGEN">Vermietungen</SelectItem>
              </SelectContent>
            </Select>
            <Select name="status" defaultValue={statusFilter || "all"}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="unconfirmed">Unbestätigt</SelectItem>
                <SelectItem value="unsubscribed">Abgemeldet</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="outline">
              <Search className="mr-2 h-4 w-4" />
              Filtern
            </Button>
            {(listFilter || statusFilter || searchQuery) && (
              <Link href="/dashboard/newsletter">
                <Button type="button" variant="ghost">
                  <X className="mr-2 h-4 w-4" />
                  Zurücksetzen
                </Button>
              </Link>
            )}
            {/* Verstecktes Feld, um die aktuelle Seite beim Filtern zurückzusetzen */}
            <input type="hidden" name="page" value="1" />
          </form>
        </CardContent>
      </Card>

      {/* Subscriber-Liste */}
      <Card>
        <CardHeader>
          <CardTitle>
            Subscriber
            {filteredCount > 0 && (
              <span className="text-base font-normal text-muted-foreground ml-2">
                ({filteredCount} {filteredCount === 1 ? "Eintrag" : "Einträge"})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {listFilter || statusFilter || searchQuery
              ? `Gefilterte Newsletter-Subscriber (${filteredCount} von ${totalCount} gesamt)`
              : "Übersicht aller Newsletter-Subscriber"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscribers.length === 0 ? (
            <div className="rounded-lg border p-12 text-center">
              <Mail className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {listFilter || statusFilter || searchQuery
                  ? "Keine Subscriber gefunden, die den Filterkriterien entsprechen"
                  : "Noch keine Subscriber vorhanden"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">E-Mail</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Listen</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Angemeldet</th>
                    <th className="text-left p-2">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((subscriber: NewsletterSubscriber) => (
                    <tr key={subscriber.id} className="border-b">
                      <td className="p-2">{subscriber.email}</td>
                      <td className="p-2">{subscriber.name || "-"}</td>
                      <td className="p-2">
                        <div className="flex gap-1 flex-wrap">
                          {subscriber.lists.map((list) => (
                            <Badge key={list} variant="secondary" className="text-xs">
                              {list === "NEWS" && "News"}
                              {list === "REISEBERICHTE" && "Reiseberichte"}
                              {list === "VERMIETUNGEN" && "Vermietungen"}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="p-2">
                        {subscriber.unsubscribedAt ? (
                          <Badge variant="destructive">Abgemeldet</Badge>
                        ) : subscriber.confirmed ? (
                          <Badge variant="default" className="bg-green-600">Bestätigt</Badge>
                        ) : (
                          <Badge variant="outline">Unbestätigt</Badge>
                        )}
                      </td>
                      <td className="p-2 text-sm text-muted-foreground">
                        {format(new Date(subscriber.createdAt), "dd.MM.yyyy", { locale: de })}
                      </td>
                      <td className="p-2">
                        <NewsletterActions subscriber={subscriber} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Seite {page} von {totalPages} ({filteredCount} {filteredCount === 1 ? "Eintrag" : "Einträge"})
              </div>
              <div className="flex gap-2">
                <Link href={createPageUrl(page - 1)}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                    Zurück
                  </Button>
                </Link>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    return (
                      <Link key={pageNum} href={createPageUrl(pageNum)}>
                        <Button
                          variant={pageNum === page ? "default" : "outline"}
                          size="sm"
                        >
                          {pageNum}
                        </Button>
                      </Link>
                    );
                  })}
                </div>
                <Link href={createPageUrl(page + 1)}>
                  <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    Weiter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

