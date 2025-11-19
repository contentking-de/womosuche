/* eslint-disable no-console */
import { prisma } from "../lib/prisma";

function removeParentheses(location: string): string {
  if (!location) return location;
  
  // Entferne Klammern und deren Inhalt, sowie umgebende Leerzeichen
  let cleaned = location
    .replace(/\([^)]*\)/g, "") // Entferne alles in runden Klammern
    .replace(/\//g, " ") // Entferne Schrägstriche (ersetze durch Leerzeichen)
    .replace(/\s+/g, " ") // Mehrfache Leerzeichen zu einem
    .trim();
  
  // Entferne führende/abschließende Kommas und Leerzeichen
  cleaned = cleaned.replace(/^,|,$/g, "").trim();
  
  return cleaned;
}

async function removeParenthesesFromLocations() {
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

    console.log("\nEntferne Klammern und Schrägstriche aus Standorten...\n");

    for (const listing of listings) {
      const cleanedLocation = removeParentheses(listing.location);
      
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
    console.error("Fehler beim Entfernen der Klammern und Schrägstriche:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

removeParenthesesFromLocations();

