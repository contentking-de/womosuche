/* eslint-disable no-console */
import { prisma } from "../lib/prisma";
import { availableBrands } from "../lib/brands";

// Verfügbare Marken - sortiert nach Länge (längste zuerst), um längere Namen zuerst zu matchen
const sortedBrands = [...availableBrands].sort((a, b) => b.length - a.length);

// Mapping von Abkürzungen zu vollständigen Markennamen
const brandAbbreviations: Record<string, string> = {
  "vw": "Volkswagen",
};

/**
 * Findet eine Marke im Titel (case-insensitive)
 */
function findBrandInTitle(title: string): string | null {
  const titleLower = title.toLowerCase();
  
  // Zuerst prüfe auf Abkürzungen (z.B. "VW" → "Volkswagen")
  for (const [abbrev, fullBrand] of Object.entries(brandAbbreviations)) {
    // Prüfe auf Abkürzung mit Wortgrenzen (z.B. "VW" als eigenständiges Wort)
    const abbrevRegex = new RegExp(`\\b${abbrev.replace(/[+]/g, "\\+")}\\b`, "i");
    if (abbrevRegex.test(titleLower)) {
      return fullBrand;
    }
    
    // Fallback: einfache Contains-Prüfung für Abkürzungen
    if (titleLower.includes(abbrev)) {
      return fullBrand;
    }
  }
  
  // Dann prüfe jede Marke (von längster zu kürzester)
  for (const brand of sortedBrands) {
    const brandLower = brand.toLowerCase();
    
    // Prüfe auf exakte Übereinstimmung oder als Wortgrenze
    // Berücksichtige auch Varianten mit Leerzeichen, Bindestrich, etc.
    const regex = new RegExp(`\\b${brandLower.replace(/[+]/g, "\\+")}\\b`, "i");
    
    if (regex.test(titleLower)) {
      return brand;
    }
    
    // Fallback: einfache Contains-Prüfung (für Fälle ohne Wortgrenzen)
    if (titleLower.includes(brandLower)) {
      return brand;
    }
  }
  
  return null;
}

async function assignBrandsFromTitle() {
  try {
    console.log("Lade alle Listings...");
    
    // Lade alle Listings ohne Marke oder mit leerer Marke
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { marke: null },
          { marke: "" },
        ],
      },
      select: {
        id: true,
        title: true,
        marke: true,
      },
    });

    console.log(`\nGefunden: ${listings.length} Listings ohne Marke`);

    if (listings.length === 0) {
      console.log("Keine Listings zum Aktualisieren gefunden.");
      return;
    }

    let updated = 0;
    let notFound = 0;
    const updates: Array<{ id: string; title: string; brand: string }> = [];

    console.log("\nPrüfe Titel auf Marken...\n");

    for (const listing of listings) {
      const foundBrand = findBrandInTitle(listing.title);
      
      if (foundBrand) {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            marke: foundBrand,
            updatedAt: new Date(),
          },
        });
        
        updated++;
        updates.push({
          id: listing.id,
          title: listing.title,
          brand: foundBrand,
        });
        
        console.log(`✓ "${listing.title.substring(0, 60)}..." → ${foundBrand}`);
      } else {
        notFound++;
        console.log(`✗ "${listing.title.substring(0, 60)}..." → Keine Marke gefunden`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`Zusammenfassung:`);
    console.log(`  Aktualisiert: ${updated} Listings`);
    console.log(`  Keine Marke gefunden: ${notFound} Listings`);
    console.log("=".repeat(60));

    if (updates.length > 0) {
      console.log("\nAktualisierte Listings:");
      updates.forEach((update) => {
        console.log(`  - ${update.brand}: "${update.title}"`);
      });
    }

    if (notFound > 0) {
      console.log("\n⚠️  Hinweis: Für einige Listings wurde keine Marke gefunden.");
      console.log("   Diese können manuell im Dashboard aktualisiert werden.");
    }
  } catch (error) {
    console.error("Fehler beim Zuweisen der Marken:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignBrandsFromTitle();

