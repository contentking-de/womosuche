"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Users, Bed } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [minSeats, setMinSeats] = useState("");
  const [minBeds, setMinBeds] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set("location", location);
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
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-xl p-4 md:p-6 flex flex-col md:flex-row gap-4">
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
    </form>
  );
}

