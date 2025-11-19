import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Users, Shield, Search } from "lucide-react";
import { PricingSection } from "@/components/marketing/pricing-section";
import { BeginnerSection } from "@/components/marketing/beginner-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { AboutSection } from "@/components/marketing/about-section";
import { BrandLogosSection } from "@/components/marketing/brand-logos-section";
import { RentalInfoSection } from "@/components/marketing/rental-info-section";
import { TestimonialsSection } from "@/components/marketing/testimonials-section";
import { HeroSection } from "@/components/hero-section";
import { MagazinSection } from "@/components/magazin-section";
import { PopularListings } from "@/components/popular-listings";
import { NewsletterConfirmationMessage } from "@/components/newsletter/newsletter-confirmation-message";
import { prisma } from "@/lib/prisma";
import { convertUmlautsToAscii } from "@/lib/slug";
import { unstable_noStore as noStore } from "next/cache";

// Deaktiviere Caching für diese Seite, damit neue Koordinaten sofort angezeigt werden
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  noStore();
  
  // Lade veröffentlichte Wohnmobile für die Karte (nur mit Koordinaten)
  const listings = await prisma.listing.findMany({
    where: { 
      published: true,
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      location: true,
      pricePerDay: true,
      lat: true,
      lng: true,
      Image: {
        take: 1,
        select: {
          url: true,
        },
      },
    },
    // Entferne das Limit, damit alle Wohnmobile angezeigt werden
  });

  // Lade Gesamtzahl aller veröffentlichten Wohnmobile
  const totalListings = await prisma.listing.count({
    where: { published: true },
  });

  // Lade 8 neueste veröffentlichte Magazin-Artikel
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
      categories: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 8,
  });

  // Lade alle veröffentlichten Listings mit Location
  const allListingsWithLocation = await prisma.listing.findMany({
    where: {
      published: true,
      location: {
        not: null,
      },
    },
    select: {
      location: true,
    },
  });

  // Gruppiere nach Location und zähle
  const cityCounts = new Map<string, number>();
  for (const listing of allListingsWithLocation) {
    if (listing.location) {
      cityCounts.set(
        listing.location,
        (cityCounts.get(listing.location) || 0) + 1
      );
    }
  }

  // Filtere Städte mit mindestens 4 Wohnmobilen
  const citiesWithEnoughListings = Array.from(cityCounts.entries())
    .filter(([_, count]) => count >= 4)
    .map(([city, _]) => city);

  // Wähle 12 zufällige Städte aus
  const shuffledCities = citiesWithEnoughListings
    .sort(() => Math.random() - 0.5)
    .slice(0, 12);

  return (
    <div className="flex flex-col">
      {/* Newsletter Confirmation Message */}
      <NewsletterConfirmationMessage />
      
      {/* Hero Section */}
      <HeroSection listings={listings.map((l: any) => ({ ...l, images: l.Image || [] }))} totalListings={totalListings} />

      {/* Brand Logos Section */}
      <BrandLogosSection />

      {/* Beliebte Wohnmobile Section */}
      <PopularListings />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Rental Info Section */}
      <RentalInfoSection />

      {/* Features Section */}
      <section className="bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Warum womosuche.de?
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Finde das perfekte Wohnmobil für dein nächstes Abenteuer
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
                <Car className="mb-4 h-8 w-8 text-primary" />
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

      {/* Beginner Section */}
      <BeginnerSection />

      {/* CTA Section */}
      <section className="bg-gray-800 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-white">
              Bereit für dein nächstes Abenteuer?
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Durchsuche unsere Auswahl an Wohnmobilen oder werde selbst Vermieter
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/wohnmobile">
                <Button size="lg">Jetzt suchen</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Magazin Section */}
      <MagazinSection articles={articles} />

      {/* FAQ Section */}
      <FAQSection />

      {/* About Section */}
      <AboutSection />

      {/* Cities Section */}
      {shuffledCities.length > 0 && (
        <section className="bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-2xl text-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Wohnmobile mieten in beliebten Städten
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Entdecke unsere Auswahl an Wohnmobilen in verschiedenen Städten
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {shuffledCities.map((city) => {
                // Konvertiere Stadtname zu URL-Slug mit Umlaut-Umschreibung
                const citySlug = convertUmlautsToAscii(city);
                return (
                  <Link
                    key={city}
                    href={`/wohnmobile/${citySlug}`}
                    className="rounded-lg border bg-card p-4 text-center transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium">{city}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
