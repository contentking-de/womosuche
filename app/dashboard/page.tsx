import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { List, MessageSquare, Plus } from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();

  const stats = await Promise.all([
    prisma.listing.count({
      where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    }),
    prisma.inquiry.count({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              listing: {
                ownerId: user.id,
              },
            },
    }),
  ]);

  const [listingsCount, inquiriesCount] = stats;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Willkommen zurück, {user.name || user.email}!</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Ihre Wohnmobile und Anfragen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wohnmobile</CardTitle>
            <CardDescription>Ihre veröffentlichten Wohnmobile</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{listingsCount}</div>
            <Link href="/dashboard/listings">
              <Button variant="outline" className="mt-4 w-full">
                <List className="mr-2 h-4 w-4" />
                Alle anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anfragen</CardTitle>
            <CardDescription>Offene Buchungsanfragen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inquiriesCount}</div>
            <Link href="/dashboard/inquiries">
              <Button variant="outline" className="mt-4 w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Alle anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Schnellaktionen</CardTitle>
            <CardDescription>Häufig verwendete Aktionen</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/listings/new">
              <Button className="mt-4 w-full">
                <Plus className="mr-2 h-4 w-4" />
                Neues Wohnmobil anlegen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

