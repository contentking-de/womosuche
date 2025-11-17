"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Users, Bed } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "50");
  const [minSeats, setMinSeats] = useState(searchParams.get("minSeats") || "");
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) {
      params.set("location", location);
      params.set("radius", radius || "50");
    }
    if (minSeats) params.set("minSeats", minSeats);
    if (minBeds) params.set("minBeds", minBeds);
    params.set("page", "1");

    router.push(`/wohnmobile?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="mt-10 w-full max-w-4xl mx-auto"
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Standort (z.B. München)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <div className="relative w-full md:w-32">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Personen"
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value)}
              className="pl-10 h-12 text-base"
              min="1"
            />
          </div>
          <div className="relative w-full md:w-32">
            <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Betten"
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
              className="pl-10 h-12 text-base"
              min="1"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="h-12 px-8 text-lg font-bold whitespace-nowrap"
          >
            <Search className="mr-2 h-5 w-5" />
            Suchen
          </Button>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Label htmlFor="radius" className="text-sm font-medium text-gray-700">
              Umkreis
            </Label>
            <span className="text-sm font-medium text-primary">
              {radius} km
            </span>
          </div>
          <Slider
            id="radius"
            min={1}
            max={200}
            step={1}
            value={[parseInt(radius) || 50]}
            onValueChange={(value) => setRadius(value[0].toString())}
            className="w-full"
            disabled={!location}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1 km</span>
            <span>200 km</span>
          </div>
          {location ? (
            <p className="text-xs text-muted-foreground">
              Zeige Wohnmobile im Umkreis von {radius} km um {location}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Bitte geben Sie zuerst einen Standort ein
            </p>
          )}
        </div>
      </div>
    </form>
  );
}

