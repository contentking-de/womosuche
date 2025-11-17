import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeLocation } from "@/lib/geocode";
import { requireAuth } from "@/lib/auth-helpers";

// Timeout für die gesamte Anfrage (30 Sekunden)
const MAX_TIMEOUT = 30000;
const MAX_LISTINGS = 100; // Maximal 100 Listings pro Request (mehr Listings, aber Timeout begrenzt)

export const runtime = "nodejs";
export const maxDuration = 30; // Vercel: max 30 Sekunden

export async function POST(request: Request) {
  try {
    // Nur für authentifizierte Benutzer (Admin oder Landlord)
    const user = await requireAuth();
    
    // Lade Listings ohne Koordinaten (null oder undefined)
    // Prisma-Filter: lat oder lng ist null UND location ist nicht leer
    const listingsWithoutCoords = await prisma.listing.findMany({
      where: {
        AND: [
          {
            OR: [
              { lat: null },
              { lng: null },
            ],
          },
          {
            location: {
              not: "",
            },
          },
        ],
      },
      select: {
        id: true,
        location: true,
      },
      take: MAX_LISTINGS,
    });

    if (listingsWithoutCoords.length === 0) {
      return NextResponse.json({
        message: "Alle Listings haben bereits Koordinaten",
        processed: 0,
      });
    }

    // Geocode Standorte sequenziell mit Rate-Limiting
    const results: Array<{ id: string; success: boolean; lat: number | null; lng: number | null }> = [];
    const startTime = Date.now();

    for (let i = 0; i < listingsWithoutCoords.length; i++) {
      // Prüfe Timeout
      if (Date.now() - startTime > MAX_TIMEOUT) {
        console.warn(`Geocoding timeout nach ${i} Listings`);
        break;
      }

      const listing = listingsWithoutCoords[i];
      
      // Rate-Limiting: Warte zwischen Anfragen (Nominatim erlaubt max 1 Anfrage/Sekunde)
      // Reduziert auf 1000ms für schnellere Verarbeitung
      if (i > 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      try {
        // Prüfe ob Location vorhanden ist
        if (!listing.location || listing.location.trim() === "") {
          console.warn(`Listing ${listing.id} hat keinen Standort`);
          results.push({
            id: listing.id,
            success: false,
            lat: null,
            lng: null,
          });
          continue;
        }

        console.log(`Geocoding listing ${listing.id} mit Standort: ${listing.location}`);
        const coords = await geocodeLocation(listing.location);
        
        if (coords) {
          console.log(`Geocoding erfolgreich für ${listing.location}: ${coords.lat}, ${coords.lng}`);
          // Aktualisiere Listing in der Datenbank
          await prisma.listing.update({
            where: { id: listing.id },
            data: {
              lat: coords.lat,
              lng: coords.lng,
            },
          });
          
          results.push({
            id: listing.id,
            success: true,
            lat: coords.lat,
            lng: coords.lng,
          });
        } else {
          console.warn(`Geocoding fehlgeschlagen für Standort: ${listing.location}`);
          results.push({
            id: listing.id,
            success: false,
            lat: null,
            lng: null,
          });
        }
      } catch (error) {
        console.error(`Geocoding failed for listing ${listing.id} (${listing.location}):`, error);
        results.push({
          id: listing.id,
          success: false,
          lat: null,
          lng: null,
        });
      }
    }

    return NextResponse.json({
      message: `${results.filter(r => r.success).length} von ${results.length} Listings erfolgreich geocodiert`,
      processed: results.length,
      successful: results.filter(r => r.success).length,
      results,
    });
  } catch (error) {
    console.error("Geocode missing listings error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

