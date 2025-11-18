"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Bed } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [radius, setRadius] = useState(searchParams.get("radius") || "50");
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) {
      params.set("location", location);
      params.set("radius", radius || "50");
    }
    if (minBeds) params.set("minBeds", minBeds);
    params.set("page", "1");

    router.push(`/wohnmobile?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="mt-10 w-full max-w-4xl mx-auto"
    >
      <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:flex-1">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
            <Input
              type="text"
              placeholder="Standort (z.B. München)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-10 h-12 text-base bg-white text-black placeholder:text-gray-500 border-black"
            />
          </div>
          <div className="relative w-full md:w-32">
            <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
            <Input
              type="number"
              placeholder="Betten"
              value={minBeds}
              onChange={(e) => setMinBeds(e.target.value)}
              className="pl-10 h-12 text-base bg-white text-black placeholder:text-gray-500 border-black"
              min="1"
            />
          </div>
          <div className="w-full md:flex-1 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius" className="text-xs font-medium text-gray-700">
                Umkreis
              </Label>
              <span className="text-xs font-medium text-primary">
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
        {location && (
          <p className="text-xs text-muted-foreground text-center">
            Zeige Wohnmobile im Umkreis von {radius} km um {location}
          </p>
        )}
      </div>
    </form>
  );
}

