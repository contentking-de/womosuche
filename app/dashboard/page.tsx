import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { List, MessageSquare, Plus, Users, TrendingUp, TrendingDown } from "lucide-react";
import { InquiriesChart } from "@/components/dashboard/inquiries-chart";
import { LandlordsRanking } from "@/components/dashboard/landlords-ranking";
import { NewsletterSubscribersChart } from "@/components/dashboard/newsletter-subscribers-chart";
import { SubscriptionCard } from "@/components/dashboard/subscription-card";
import { NewListingButton } from "@/components/listings/new-listing-button";

export default async function DashboardPage() {
  const user = await requireAuth();

  // EDITORs sehen keine Statistiken für Wohnmobile/Anfragen
  if (user.role === "EDITOR") {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Willkommen zurück, {user.name || user.email}!</h1>
          <p className="mt-2 text-muted-foreground">
            Verwalten Sie Lexikon und Magazin
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lexikon</CardTitle>
              <CardDescription>Verwalten Sie Lexikon-Begriffe</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/lexikon">
                <Button variant="outline" className="mt-4 w-full">
                  <List className="mr-2 h-4 w-4" />
                  Lexikon verwalten
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Magazin</CardTitle>
              <CardDescription>Verwalten Sie Magazin-Artikel</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/magazin">
                <Button variant="outline" className="mt-4 w-full">
                  <List className="mr-2 h-4 w-4" />
                  Magazin verwalten
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const stats = await Promise.all([
    prisma.listing.count({
      where: user.role === "ADMIN" ? {} : { ownerId: user.id },
    }),
    prisma.inquiry.count({
      where:
        user.role === "ADMIN"
          ? {}
          : {
              Listing: {
                ownerId: user.id,
              },
            },
    }),
  ]);

  const [listingsCount, inquiriesCount] = stats;

  // Lade Subscription für LANDLORD
  let subscription = null;
  if (user.role === "LANDLORD") {
    subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });
    
    // Debug: Log für Subscription-Status
    if (!subscription) {
      console.log(`[Dashboard] Keine Subscription gefunden für User ${user.id} (${user.email})`);
    } else {
      console.log(`[Dashboard] Subscription gefunden:`, {
        userId: subscription.userId,
        status: subscription.status,
        priceId: subscription.stripePriceId,
      });
    }
  }

  // Zusätzliche Statistiken für ADMIN
  let landlordsStats = null;
  let inquiriesPerDay = null;
  let topLandlords = null;
  let newsletterStats = null;
  let newsletterSubscribersPerDay = null;

  if (user.role === "ADMIN") {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Anzahl Vermieter jetzt und vor 30 Tagen
    const [currentLandlordsCount, previousLandlordsCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: "LANDLORD",
        },
      }),
      prisma.user.count({
        where: {
          role: "LANDLORD",
          createdAt: {
            lte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    landlordsStats = {
      current: currentLandlordsCount,
      previous: previousLandlordsCount,
      change: currentLandlordsCount - previousLandlordsCount,
    };

    // Anfragen pro Tag für die letzten 30 Tage
    const inquiries = await prisma.inquiry.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Gruppiere nach Tag
    const inquiriesByDay = new Map<string, number>();
    inquiries.forEach((inquiry: { createdAt: Date }) => {
      const date = new Date(inquiry.createdAt);
      const dateKey = date.toISOString().split("T")[0];
      inquiriesByDay.set(dateKey, (inquiriesByDay.get(dateKey) || 0) + 1);
    });

    // Erstelle Array für die letzten 30 Tage
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      days.push({
        date: dateKey,
        count: inquiriesByDay.get(dateKey) || 0,
      });
    }

    inquiriesPerDay = days;

    // Rangliste der Vermieter mit den meisten Anfragen
    const landlordsWithInquiries = await prisma.user.findMany({
      where: {
        role: "LANDLORD",
      },
      include: {
        Listing: {
          include: {
            Inquiry: true,
          },
        },
      },
    });

    type LandlordRankingItem = {
      id: string;
      name: string;
      email: string;
      inquiryCount: number;
    };

    const landlordsRanking: LandlordRankingItem[] = landlordsWithInquiries
      .map((landlord: typeof landlordsWithInquiries[number]) => {
        const inquiryCount = landlord.Listing.reduce(
          (sum: number, listing: typeof landlord.Listing[number]) => sum + listing.Inquiry.length,
          0
        );
        return {
          id: landlord.id,
          name: landlord.name || landlord.email,
          email: landlord.email,
          inquiryCount,
        };
      })
      .filter((landlord: LandlordRankingItem) => landlord.inquiryCount > 0)
      .sort((a: LandlordRankingItem, b: LandlordRankingItem) => b.inquiryCount - a.inquiryCount)
      .slice(0, 10); // Top 10

    topLandlords = landlordsRanking;

    // Newsletter-Abonnenten Statistiken
    const confirmedSubscribersCount = await prisma.newsletterSubscriber.count({
      where: {
        confirmed: true,
        unsubscribedAt: null,
      },
    });

    newsletterStats = {
      current: confirmedSubscribersCount,
    };

    // Newsletter-Abonnenten pro Tag für die letzten 30 Tage
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: {
        confirmed: true,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Gruppiere nach Tag
    const subscribersByDay = new Map<string, number>();
    subscribers.forEach((subscriber: { createdAt: Date }) => {
      const date = new Date(subscriber.createdAt);
      const dateKey = date.toISOString().split("T")[0];
      subscribersByDay.set(dateKey, (subscribersByDay.get(dateKey) || 0) + 1);
    });

    // Erstelle Array für die letzten 30 Tage (kumulativ)
    const newsletterDays = [];
    let cumulativeCount = 0;
    
    // Zähle alle bestätigten Abonnenten vor dem 30-Tage-Zeitraum
    const subscribersBeforePeriod = await prisma.newsletterSubscriber.count({
      where: {
        confirmed: true,
        createdAt: {
          lt: thirtyDaysAgo,
        },
        unsubscribedAt: null,
      },
    });
    
    cumulativeCount = subscribersBeforePeriod;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const newSubscribers = subscribersByDay.get(dateKey) || 0;
      cumulativeCount += newSubscribers;
      newsletterDays.push({
        date: dateKey,
        count: cumulativeCount,
      });
    }

    newsletterSubscribersPerDay = newsletterDays;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Willkommen zurück, {user.name || user.email}!</h1>
        <p className="mt-2 text-muted-foreground">
          Verwalten Sie Ihre Wohnmobile und Anfragen
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            {user.role === "LANDLORD" ? (
              <NewListingButton 
                userId={user.id} 
                userRole={user.role} 
                className="mt-4 w-full"
              />
            ) : (
              <Link href="/dashboard/listings/new">
                <Button className="mt-4 w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Neues Wohnmobil anlegen
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        {user.role === "ADMIN" && landlordsStats && (
          <Card>
            <CardHeader>
              <CardTitle>Vermieter</CardTitle>
              <CardDescription>Gesamtanzahl Vermieter</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{landlordsStats.current}</div>
              <div className="mt-2 flex items-center text-sm">
                {landlordsStats.change > 0 ? (
                  <>
                    <TrendingUp className="mr-1 h-4 w-4 text-green-600" />
                    <span className="text-green-600">
                      +{landlordsStats.change} seit letztem Monat
                    </span>
                  </>
                ) : landlordsStats.change < 0 ? (
                  <>
                    <TrendingDown className="mr-1 h-4 w-4 text-red-600" />
                    <span className="text-red-600">
                      {landlordsStats.change} seit letztem Monat
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Keine Änderung</span>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* Subscription-Anzeige für LANDLORD */}
      {user.role === "LANDLORD" && (
        <div className="mt-4">
          <SubscriptionCard subscription={subscription} currentVehiclesCount={listingsCount} />
        </div>
      )}

      {/* Admin-spezifische Statistiken */}
      {user.role === "ADMIN" && landlordsStats && (
        <>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Anfragen pro Tag</CardTitle>
                <CardDescription>Anfragen der letzten 30 Tage</CardDescription>
              </CardHeader>
              <CardContent>
                {inquiriesPerDay && <InquiriesChart data={inquiriesPerDay} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Vermieter</CardTitle>
                <CardDescription>Vermieter mit den meisten Anfragen</CardDescription>
              </CardHeader>
              <CardContent>
                {topLandlords && <LandlordsRanking landlords={topLandlords} />}
              </CardContent>
            </Card>
          </div>

          {newsletterSubscribersPerDay && newsletterStats && (
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Newsletter Abonnenten</CardTitle>
                  <CardDescription>Bestätigte Abonnenten</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{newsletterStats.current}</div>
                  <Link href="/dashboard/newsletter">
                    <Button variant="outline" className="mt-4 w-full">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Abonnenten verwalten
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Newsletter Abonnenten Entwicklung</CardTitle>
                  <CardDescription>Entwicklung der Abonnenten über die letzten 30 Tage</CardDescription>
                </CardHeader>
                <CardContent>
                  <NewsletterSubscribersChart data={newsletterSubscribersPerDay} />
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

