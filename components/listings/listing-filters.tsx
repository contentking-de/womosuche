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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { availableBrands } from "@/lib/brands";
import { convertUmlautsToAscii } from "@/lib/slug";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";

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

interface ListingFiltersProps {
  brand?: string;
  location?: string;
}

export function ListingFilters({ brand, location: initialLocation }: ListingFiltersProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(initialLocation || searchParams.get("location") || "");
  const [radius, setRadius] = useState(
    searchParams.get("radius") || "50"
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minSeats, setMinSeats] = useState(searchParams.get("minSeats") || "");
  const [minBeds, setMinBeds] = useState(searchParams.get("minBeds") || "");
  const [selectedBrand, setSelectedBrand] = useState(
    searchParams.get("marke") || ""
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    searchParams.get("features")?.split(",").filter(Boolean) || []
  );
  const [isOpen, setIsOpen] = useState(false);

  // Prüfe ob Filter aktiv sind
  const hasActiveFilters = Boolean(
    location ||
    minPrice ||
    maxPrice ||
    minSeats ||
    minBeds ||
    selectedBrand ||
    selectedFeatures.length > 0
  );

  const getBasePath = () => {
    if (brand) {
      return `/wohnmobile/${brand.toLowerCase()}`;
    }
    if (initialLocation) {
      // Verwende ASCII-Variante für URLs (konsistent mit Startseite)
      return `/wohnmobile/${convertUmlautsToAscii(initialLocation)}`;
    }
    return "/wohnmobile";
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    // Wenn wir bereits auf einer Stadt-Seite sind (initialLocation vorhanden), 
    // füge keine Location-Parameter hinzu, da die Location bereits im URL-Pfad ist
    if (location && !initialLocation) {
      params.set("location", location);
      // Wenn Standort vorhanden, aber kein Radius: Standard 50km verwenden
      params.set("radius", radius || "50");
    }
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (minSeats) params.set("minSeats", minSeats);
    if (minBeds) params.set("minBeds", minBeds);
    if (selectedBrand) params.set("marke", selectedBrand);
    if (selectedFeatures.length > 0) params.set("features", selectedFeatures.join(","));
    
    // Nur page=1 hinzufügen, wenn es auch andere Parameter gibt
    const hasOtherParams = params.toString().length > 0;
    if (hasOtherParams) {
      params.set("page", "1");
    }

    const queryString = params.toString();
    router.push(queryString ? `${getBasePath()}?${queryString}` : getBasePath());
  };

  const clearFilters = () => {
    setLocation("");
    setRadius("");
    setMinPrice("");
    setMaxPrice("");
    setMinSeats("");
    setMinBeds("");
    setSelectedBrand("");
    setSelectedFeatures([]);
    router.push(getBasePath());
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
      // Wenn wir bereits auf einer Stadt-Seite sind (initialLocation vorhanden), 
      // füge keine Location-Parameter hinzu
      if (location && !initialLocation) {
        params.set("location", location);
        params.set("radius", radius || "50");
      }
      if (minPrice) params.set("minPrice", minPrice);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (minSeats) params.set("minSeats", minSeats);
      if (minBeds) params.set("minBeds", minBeds);
      if (selectedBrand) params.set("marke", selectedBrand);
      if (selectedFeatures.length > 0) params.set("features", selectedFeatures.join(","));
      
      // Nur page=1 hinzufügen, wenn es auch andere Parameter gibt
      const hasOtherParams = params.toString().length > 0;
      if (hasOtherParams) {
        params.set("page", "1");
      }

      const queryString = params.toString();
      router.push(queryString ? `${getBasePath()}?${queryString}` : getBasePath());
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
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between text-left lg:cursor-default"
          type="button"
        >
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                Aktiv
              </span>
            )}
          </CardTitle>
          <div className="lg:hidden">
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>
      </CardHeader>
      <CardContent className={`space-y-4 ${isOpen ? "" : "hidden"} lg:block`}>
        <div className="space-y-2">
          <Label htmlFor="location">Standort</Label>
          <Input
            id="location"
            placeholder="z.B. Ravensburg"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

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

        <Separator />

        <div className="space-y-2">
          <Label htmlFor="marke">Marke</Label>
          <Select
            value={selectedBrand}
            onValueChange={(value) => setSelectedBrand(value === "__none__" ? "" : value)}
            disabled={!!brand} // Deaktiviere wenn bereits auf Marken-Seite
          >
            <SelectTrigger id="marke">
              <SelectValue placeholder="Alle Marken" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Alle Marken</SelectItem>
              {[...availableBrands].sort((a, b) => a.localeCompare(b, "de")).map((brandOption) => (
                <SelectItem key={brandOption} value={brandOption}>
                  {brandOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

