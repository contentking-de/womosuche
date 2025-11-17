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
  lat: number | null;
  lng: number | null;
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
        <div className="mx-auto max-w-5xl text-center flex flex-col">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl text-white drop-shadow-lg order-1">
            Wohnmobile in Deiner Nähe mieten
          </h1>
          
          {/* Suchfunktion - Mobile: direkt unter Headline (order-2), Desktop: nach Subtext (md:order-3) */}
          <div className="mt-6 order-2 md:order-3">
            <HeroSearch />
          </div>
          
          <p className="mt-6 text-lg leading-8 text-white/90 drop-shadow-md order-3 md:order-2">
            Entdecke eine große Auswahl an Wohnmobilen für dein nächstes Abenteuer.
            Oder vermiete dein eigenes Wohnmobil und verdiene Geld damit.
          </p>

          <div className="mt-6 flex items-center justify-center gap-x-6 gap-y-3 flex-wrap order-4">
            <Button
              onClick={() => setShowMap(true)}
              size="lg"
              className="px-8 py-6 text-lg font-bold bg-green-600 hover:bg-green-700 text-white border-0 shadow-lg"
            >
              <Map className="mr-2 h-5 w-5" />
              Auf Karte anzeigen
            </Button>
            <Link href="/wohnmobile">
              <Button
                size="lg"
                className="px-8 py-6 text-lg font-bold shadow-lg"
              >
                Alle Wohnmobile anzeigen
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-bold bg-gray-100/90 hover:bg-gray-200/90 text-gray-700 border-gray-300/50 shadow-lg"
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

