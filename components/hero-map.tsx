"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Dynamischer Import für Leaflet (nur Client-Side)
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

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

interface HeroMapProps {
  listings: Listing[];
  onClose: () => void;
}

export function HeroMap({ listings, onClose }: HeroMapProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  // Fix für Leaflet Icons - nur im Client ausführen
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((L) => {
        delete (L.default.Icon.Default.prototype as any)._getIconUrl;
        L.default.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });
      });
    }
  }, []);
  
  // Filtere Listings mit vorhandenen Koordinaten
  const listingsWithCoords = listings.filter(
    (listing) => listing.lat !== null && listing.lng !== null
  );

  // Berechne Mittelpunkt der Karte basierend auf allen Markern
  const center: [number, number] = listingsWithCoords.length > 0
    ? [
        listingsWithCoords.reduce((sum, l) => sum + (l.lat || 0), 0) / listingsWithCoords.length,
        listingsWithCoords.reduce((sum, l) => sum + (l.lng || 0), 0) / listingsWithCoords.length,
      ]
    : [51.1657, 10.4515]; // Deutschland Mittelpunkt

  if (!isClient) {
    return (
      <div className="relative min-h-[600px] flex items-center justify-center bg-muted">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Karte wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[600px] w-full">
      <div className="absolute top-4 right-4 z-[1000]">
        <Button
          onClick={onClose}
          variant="secondary"
          size="sm"
          className="bg-white/95 backdrop-blur-sm shadow-lg"
        >
          <X className="h-4 w-4 mr-2" />
          Zur Listenansicht
        </Button>
      </div>
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%", minHeight: "600px" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {listingsWithCoords.map((listing) => (
          <Marker
            key={listing.id}
            position={[listing.lat!, listing.lng!]}
          >
            <Popup>
              <Card className="w-64 border-0 shadow-lg">
                <CardContent className="p-4">
                  {listing.images && listing.images.length > 0 && (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                  )}
                  <h3 className="font-bold text-sm mb-1 line-clamp-2">{listing.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <MapPin className="h-3 w-3" />
                    <span>{listing.location}</span>
                  </div>
                  <p className="text-lg font-bold text-primary mb-2">
                    {listing.pricePerDay} €/Tag
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => router.push(`/wohnmobile/${listing.slug}`)}
                  >
                    Details anzeigen
                  </Button>
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

