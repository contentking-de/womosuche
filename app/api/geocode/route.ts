import { NextResponse } from "next/server";

// Timeout für die gesamte Anfrage (30 Sekunden)
const MAX_TIMEOUT = 30000;
const MAX_LOCATIONS = 50; // Maximal 50 Standorte pro Request

// Stelle sicher, dass wir Node.js Runtime verwenden (nicht Edge)
export const runtime = "nodejs";
export const maxDuration = 30; // Vercel: max 30 Sekunden

export async function POST(request: Request) {
  try {
    const { locations } = await request.json();
    
    if (!Array.isArray(locations)) {
      return NextResponse.json(
        { error: "locations must be an array" },
        { status: 400 }
      );
    }

    // Limit auf MAX_LOCATIONS
    const limitedLocations = locations.slice(0, MAX_LOCATIONS);
    
    // Entferne Duplikate
    const uniqueLocations = Array.from(new Set(limitedLocations));

    // Geocode Standorte sequenziell mit Rate-Limiting
    const results: Array<{ location: string; lat: number | null; lng: number | null }> = [];
    
    const startTime = Date.now();
    
    for (let i = 0; i < uniqueLocations.length; i++) {
      // Prüfe Timeout
      if (Date.now() - startTime > MAX_TIMEOUT) {
        console.warn(`Geocoding timeout nach ${i} Standorten`);
        // Füge fehlende Standorte als null hinzu
        for (let j = i; j < uniqueLocations.length; j++) {
          results.push({
            location: uniqueLocations[j],
            lat: null,
            lng: null,
          });
        }
        break;
      }

      const location = uniqueLocations[i];
      
      // Rate-Limiting: Warte zwischen Anfragen (Nominatim erlaubt max 1 Anfrage/Sekunde)
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1100));
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
          {
            headers: {
              "User-Agent": "Womosuche/1.0 (https://womosuche.de)",
              "Accept-Language": "de",
            },
            signal: AbortSignal.timeout(5000), // 5 Sekunden Timeout pro Anfrage
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (data && data.length > 0) {
          results.push({
            location,
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          });
        } else {
          results.push({
            location,
            lat: null,
            lng: null,
          });
        }
      } catch (error) {
        console.error(`Geocoding failed for ${location}:`, error);
        results.push({
          location,
          lat: null,
          lng: null,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Geocoding API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

