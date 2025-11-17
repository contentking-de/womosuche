import { readFile } from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";
import { prisma } from "../lib/prisma";

interface ManualMapping {
  slug: string;
  user_email: string;
}

async function applyManualMappings() {
  try {
    const csvFile = path.join(process.cwd(), "public", "unmatched-listings.csv");
    console.log(`📂 Lese Mapping-Datei: ${csvFile}\n`);

    let csvContent: string;
    try {
      csvContent = await readFile(csvFile, "utf8");
    } catch (error: any) {
      if (error.code === "ENOENT") {
        console.error(`❌ Datei nicht gefunden: ${csvFile}`);
        console.error(`\n💡 Bitte führe zuerst aus: npm run map:listings`);
        console.error(`   Dies erstellt die Datei unmatched-listings.csv`);
        process.exit(1);
      }
      throw error;
    }
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as (ManualMapping & { user_email?: string })[];

    console.log(`📄 ${records.length} Zeilen gefunden\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const record of records) {
      try {
        const slug = record.slug?.trim();
        const userEmail = record.user_email?.trim();

        if (!slug) {
          console.warn(`⚠️  Zeile übersprungen: Kein Slug`);
          skipped++;
          continue;
        }

        if (!userEmail) {
          console.log(`⏭️  Kein user_email für ${slug} - übersprungen`);
          skipped++;
          continue;
        }

        // Finde User
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
        });

        if (!user) {
          console.warn(`⚠️  User nicht gefunden: ${userEmail}`);
          skipped++;
          continue;
        }

        // Finde Listing
        const listing = await prisma.listing.findUnique({
          where: { slug },
        });

        if (!listing) {
          console.warn(`⚠️  Listing nicht gefunden: ${slug}`);
          skipped++;
          continue;
        }

        // Update ownerId
        if (listing.ownerId !== user.id) {
          await prisma.listing.update({
            where: { id: listing.id },
            data: { ownerId: user.id },
          });
          updated++;
          console.log(`✅ ${slug} → ${userEmail}`);
        } else {
          console.log(`ℹ️  ${slug} bereits korrekt zugeordnet`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Fehler bei ${record.slug}:`, error);
      }
    }

    console.log(`\n📊 Manuelles Mapping abgeschlossen:`);
    console.log(`  ✅ Aktualisiert: ${updated}`);
    console.log(`  ⏭️  Übersprungen: ${skipped}`);
    console.log(`  ❌ Fehler: ${errors}`);
  } catch (error) {
    console.error("❌ Fehler:", error);
    throw error;
  }
}

async function main() {
  try {
    await applyManualMappings();
  } catch (error) {
    console.error("❌ Fehler:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

