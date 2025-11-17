import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Shield, Search } from "lucide-react";
import { PricingSection } from "@/components/marketing/pricing-section";
import { HeroSection } from "@/components/hero-section";
import { MagazinSection } from "@/components/magazin-section";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  // Lade veröffentlichte Wohnmobile für die Karte
  const listings = await prisma.listing.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      location: true,
      pricePerDay: true,
      images: {
        take: 1,
        select: {
          url: true,
        },
      },
    },
    take: 100, // Limit für Performance
  });

  // Lade 6 neueste veröffentlichte Magazin-Artikel
  const articles = await prisma.article.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      tags: true,
      featuredImageUrl: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <HeroSection listings={listings} />

      {/* Features Section */}
      <section className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Warum unsere Plattform?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Alles, was du für eine erfolgreiche Wohnmobil-Vermietung brauchst
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2 lg:max-w-none lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Search className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Einfache Suche</CardTitle>
                <CardDescription>
                  Finde schnell das passende Wohnmobil mit unseren Filtern
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Sicher & Zuverlässig</CardTitle>
                <CardDescription>
                  Verifizierte Vermieter und sichere Buchungsprozesse
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Users className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Große Community</CardTitle>
                <CardDescription>
                  Tausende zufriedene Mieter und Vermieter
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Home className="mb-4 h-8 w-8 text-primary" />
                <CardTitle>Vermiete einfach</CardTitle>
                <CardDescription>
                  Verwalte deine Wohnmobile bequem im Dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Bereit für dein nächstes Abenteuer?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Durchsuche unsere Auswahl an Wohnmobilen oder werde selbst Vermieter
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/wohnmobile">
              <Button size="lg">Jetzt suchen</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Magazin Section */}
      <MagazinSection articles={articles} />
    </div>
  );
}
