import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Shield, Search } from "lucide-react";
import { PricingSection } from "@/components/marketing/pricing-section";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Hintergrundbild */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/wohnmobile-mieten-hero.jpg"
            alt="Wohnmobil Vermietung"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Overlay für bessere Lesbarkeit */}
          <div className="absolute inset-0 bg-black/50" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-white drop-shadow-lg">
              Finde dein perfektes Wohnmobil
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/90 drop-shadow-md">
              Entdecke eine große Auswahl an Wohnmobilen für dein nächstes Abenteuer.
              Oder vermiete dein eigenes Wohnmobil und verdiene Geld damit.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/wohnmobile">
                <Button size="lg" className="px-8 py-6 text-lg font-bold">
                  Wohnmobile entdecken
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="px-8 py-6 text-lg font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20">
                  Als Vermieter registrieren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
    </div>
  );
}
