/* eslint-disable no-console */
import { prisma } from "../lib/prisma";

/**
 * Entfernt Postleitzahlen aus einem Standort-String
 * Deutsche Postleitzahlen sind 5-stellig (z.B. 12345)
 */
function removePostalCode(location: string): string {
  if (!location) return location;

  // Entferne 5-stellige Postleitzahlen am Anfang oder Ende
  // Beispiele: "80331 München" → "München", "München, 80331" → "München"
  
  // Entferne Postleitzahlen am Anfang (z.B. "80331 München" oder "80331, München")
  let cleaned = location.replace(/^\d{5}\s*,?\s*/i, "");
  
  // Entferne Postleitzahlen am Ende (z.B. "München, 80331" oder "München 80331")
  cleaned = cleaned.replace(/\s*,?\s*\d{5}$/i, "");
  
  // Entferne Postleitzahlen in der Mitte mit Komma (z.B. "München, 80331, Bayern")
  cleaned = cleaned.replace(/\s*,\s*\d{5}\s*,/i, ",");
  
  // Entferne Postleitzahlen in der Mitte ohne Komma (z.B. "München 80331 Bayern")
  cleaned = cleaned.replace(/\s+\d{5}\s+/i, " ");
  
  // Bereinige mehrfache Leerzeichen und Kommas
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/\s*,\s*,/g, ",").trim();
  cleaned = cleaned.replace(/^,|,$/g, "").trim();
  
  return cleaned;
}

async function removePostalCodes() {
  try {
    console.log("Lade alle Listings...");
    
    const listings = await prisma.listing.findMany({
      select: {
        id: true,
        location: true,
      },
    });

    console.log(`\nGefunden: ${listings.length} Listings`);

    if (listings.length === 0) {
      console.log("Keine Listings gefunden.");
      return;
    }

    let updated = 0;
    let unchanged = 0;
    const updates: Array<{ id: string; old: string; new: string }> = [];

    console.log("\nEntferne Postleitzahlen...\n");

    for (const listing of listings) {
      const cleanedLocation = removePostalCode(listing.location);
      
      if (cleanedLocation !== listing.location) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            location: cleanedLocation,
            updatedAt: new Date(),
          },
        });
        
        updated++;
        updates.push({
          id: listing.id,
          old: listing.location,
          new: cleanedLocation,
        });
        
        console.log(`✓ "${listing.location}" → "${cleanedLocation}"`);
      } else {
        unchanged++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Zusammenfassung:`);
    console.log(`  Aktualisiert: ${updated} Listings`);
    console.log(`  Unverändert: ${unchanged} Listings`);
    console.log("=".repeat(60));

    if (updates.length > 0) {
      console.log("\nAktualisierte Standorte:");
      updates.slice(0, 20).forEach((update) => {
        console.log(`  - "${update.old}" → "${update.new}"`);
      });
      if (updates.length > 20) {
        console.log(`  ... und ${updates.length - 20} weitere`);
      }
    }
  } catch (error) {
    console.error("Fehler beim Entfernen der Postleitzahlen:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removePostalCodes();

