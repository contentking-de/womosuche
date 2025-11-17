"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/hero-search";
import { HeroMap } from "@/components/hero-map";
import { Map } from "lucide-react";

interface Listing {
  id: string;
  title: string;
  slug: string;
  location: string;
  pricePerDay: number;
  images: { url: string }[];
}

interface HeroSectionProps {
  listings: Listing[];
}

export function HeroSection({ listings }: HeroSectionProps) {
  const [showMap, setShowMap] = useState(false);

  if (showMap) {
    return <HeroMap listings={listings} onClose={() => setShowMap(false)} />;
  }

  return (
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
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-white drop-shadow-lg">
            Finde dein perfektes Wohnmobil
          </h1>
          <p className="mt-6 text-lg leading-8 text-white/90 drop-shadow-md">
            Entdecke eine große Auswahl an Wohnmobilen für dein nächstes Abenteuer.
            Oder vermiete dein eigenes Wohnmobil und verdiene Geld damit.
          </p>

          {/* Suchfunktion */}
          <HeroSearch />

          <div className="mt-6 flex items-center justify-center gap-x-6 flex-wrap">
            <Button
              onClick={() => setShowMap(true)}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-lg font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Map className="mr-2 h-5 w-5" />
              Auf Karte anzeigen
            </Button>
            <Link href="/wohnmobile">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                Alle Wohnmobile anzeigen
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
              >
                Als Vermieter registrieren
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

