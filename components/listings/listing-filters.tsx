"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";

const availableFeatures = [
  "Klimaanlage",
  "Heizung",
  "Küche",
  "Kühlschrank",
  "Dusche",
  "WC",
  "Solar",
  "Generator",
  "Satellit",
  "WLAN",
  "Fahrradträger",
  "Auffahrrampe",
];

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("location") || "");
  const [radius, setRadius] = useState(
    searchParams.get("radius") || "50"
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minSeats, setMinSeats] = useState(searchParams.get("minSeats") || "");
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    searchParams.get("features")?.split(",").filter(Boolean) || []
  );

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (location) {
      params.set("location", location);
      // Wenn Standort vorhanden, aber kein Radius: Standard 50km verwenden
      params.set("radius", radius || "50");
    }
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minSeats) params.set("minSeats", minSeats);
    if (minBeds) params.set("minBeds", minBeds);
    if (selectedFeatures.length > 0) params.set("features", selectedFeatures.join(","));
    params.set("page", "1");

    router.push(`/wohnmobile?${params.toString()}`);
  };

  const clearFilters = () => {
    setLocation("");
    setRadius("");
    setMinPrice("");
    setMaxPrice("");
    setMinSeats("");
    setMinBeds("");
    setSelectedFeatures([]);
    router.push("/wohnmobile");
  };

  const toggleFeature = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      setSelectedFeatures(selectedFeatures.filter((f) => f !== feature));
    } else {
      setSelectedFeatures([...selectedFeatures, feature]);
    }
  };

  // Automatische Filterung beim Ändern des Radius (mit Debounce)
  const radiusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Überspringe die automatische Filterung beim ersten Laden
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Nur automatisch filtern, wenn ein Standort vorhanden ist
    if (!location) return;

    // Lösche vorherigen Timeout
    if (radiusTimeoutRef.current) {
      clearTimeout(radiusTimeoutRef.current);
    }

    // Setze neuen Timeout für Debounce (500ms Verzögerung)
    radiusTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams();
      params.set("location", location);
      params.set("radius", radius || "50");
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minSeats) params.set("minSeats", minSeats);
      if (minBeds) params.set("minBeds", minBeds);
      if (selectedFeatures.length > 0) params.set("features", selectedFeatures.join(","));
      params.set("page", "1");

      router.push(`/wohnmobile?${params.toString()}`);
    }, 500);

    // Cleanup
    return () => {
      if (radiusTimeoutRef.current) {
        clearTimeout(radiusTimeoutRef.current);
      }
    };
  }, [radius]); // Nur bei Änderung von radius

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Standort</Label>
          <Input
            id="location"
            placeholder="z.B. Ravensburg"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {location && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="radius">Umkreis</Label>
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
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 km</span>
              <span>200 km</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Zeige Wohnmobile im Umkreis von {radius} km um {location}
            </p>
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Label>Preis pro Tag</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Min"
              type="number"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <Input
              placeholder="Max"
              type="number"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="minSeats">Mindestens Sitzplätze</Label>
          <Input
            id="minSeats"
            type="number"
            placeholder="z.B. 4"
            value={minSeats}
            onChange={(e) => setMinSeats(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minBeds">Mindestens Betten</Label>
          <Input
            id="minBeds"
            type="number"
            placeholder="z.B. 4"
            value={minBeds}
            onChange={(e) => setMinBeds(e.target.value)}
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <Label>Ausstattung</Label>
          <div className="space-y-2">
            {availableFeatures.map((feature) => (
              <div key={feature} className="flex items-center space-x-2">
                <Checkbox
                  id={feature}
                  checked={selectedFeatures.includes(feature)}
                  onCheckedChange={() => toggleFeature(feature)}
                />
                <Label
                  htmlFor={feature}
                  className="text-sm font-normal cursor-pointer"
                >
                  {feature}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters} className="flex-1">
            Filter anwenden
          </Button>
          <Button onClick={clearFilters} variant="outline">
            Zurücksetzen
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

