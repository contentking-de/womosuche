import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Import Prisma Client directly to avoid caching issues
let prismaInstance: any = null;

function getPrismaClient() {
  if (!prismaInstance) {
    // Clear require cache first
    try {
      const prismaClientPath = require.resolve("@prisma/client");
      delete require.cache[prismaClientPath];
      Object.keys(require.cache).forEach(key => {
        if (key.includes("@prisma/client") || key.includes(".prisma")) {
          delete require.cache[key];
        }
      });
    } catch (e) {
      // Ignore cache clearing errors
    }
    
    // Create fresh Prisma Client instance
    const { PrismaClient } = require("@prisma/client");
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });
    
    // Verify it has the outreachPlace model
    if (typeof prismaInstance.outreachPlace === 'undefined') {
      throw new Error("Prisma Client missing outreachPlace model. Please run 'npx prisma generate' and restart the server.");
    }
    
    console.log("Prisma Client initialized with outreachPlace model");
  }
  return prismaInstance;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    
    // Nur ADMINs können importieren
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    
    // Parse JSON
    let places: any[];
    try {
      places = JSON.parse(fileContent);
    } catch (error) {
      return NextResponse.json(
        { error: "Ungültige JSON-Datei" },
        { status: 400 }
      );
    }

    if (!Array.isArray(places) || places.length === 0) {
      return NextResponse.json(
        { error: "JSON-Datei muss ein Array von Vermietungen enthalten" },
        { status: 400 }
      );
    }

    let imported = 0;
    let updated = 0;
    let errors: string[] = [];

    // Get Prisma Client (will create new instance if needed)
    const prisma = getPrismaClient();

    console.log(`Starte Import von ${places.length} Vermietungen...`);

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      try {
        // Validiere erforderliche Felder
        if (!place.Name) {
          errors.push(`Eintrag ${i + 1}: Vermietung ohne Name übersprungen`);
          continue;
        }

        console.log(`[${i + 1}/${places.length}] Verarbeite: ${place.Name}`);

        const data = {
          name: place.Name,
          address: place.Address || null,
          phone: place.Phone || null,
          website: place.Website || null,
          email: place.Email || null,
          latitude: place.Latitude ? String(place.Latitude) : null,
          longitude: place.Longitude ? String(place.Longitude) : null,
          googlePlaceId: place.Placeid || null,
          googleCID: place.GoogleCID || null,
          googleFID: place.GoogleFID || null,
          rating: place.Rating ? String(place.Rating) : null,
          reviews: place.Reviews ? String(place.Reviews) : null,
          status: place.Status || null,
          category: place.Category || null,
          keyword: place.Keyword || null,
          priceRange: place.PriceRange || null,
          timing: place.Timing || null,
          url: place.Url || null,
          listingUrl: place.Listing_Url || null,
          reviewsLink: place.Reviews_Link || null,
        };

        // Prüfe ob bereits vorhanden (anhand Google Place ID oder Name + Adresse)
        let existing = null;
        if (place.Placeid) {
          try {
            existing = await prisma.outreachPlace.findUnique({
              where: { googlePlaceId: place.Placeid },
            });
          } catch (err) {
            console.error(`Fehler beim Prüfen auf vorhandenen Eintrag (PlaceID):`, err);
          }
        }
        
        if (!existing) {
          try {
            existing = await prisma.outreachPlace.findFirst({
              where: {
                name: place.Name,
                address: place.Address || undefined,
              },
            });
          } catch (err) {
            console.error(`Fehler beim Prüfen auf vorhandenen Eintrag (Name+Adresse):`, err);
          }
        }

        if (existing) {
          // Aktualisiere bestehenden Eintrag
          await prisma.outreachPlace.update({
            where: { id: existing.id },
            data,
          });
          updated++;
          console.log(`  ✓ Aktualisiert`);
        } else {
          // Erstelle neuen Eintrag
          await prisma.outreachPlace.create({
            data,
          });
          imported++;
          console.log(`  ✓ Importiert`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unbekannter Fehler";
        const errorDetails = error instanceof Error ? error.stack : String(error);
        console.error(`Fehler bei ${place.Name || `Eintrag ${i + 1}`}:`, errorDetails);
        errors.push(`${place.Name || `Eintrag ${i + 1}`}: ${errorMsg}`);
      }
    }

    console.log(`Import abgeschlossen: ${imported} importiert, ${updated} aktualisiert, ${errors.length} Fehler`);

    const response = {
      imported,
      updated,
      total: places.length,
      errors: errors.length > 0 ? errors : undefined,
    };

    console.log("Response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Outreach upload error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

