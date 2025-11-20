import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TARGET_USER_ID = "cmi31v7wt003nte26pt66t9jg"; // MS Reisemobile GmbH
const LOCATION = "Münster";
const SOURCE_USER_NAME = "Import User";

async function reassignMuensterListings() {
  try {
    console.log("🔍 Suche nach betroffenen Listings...\n");

    // Finde den "Import User"
    const importUser = await prisma.user.findFirst({
      where: {
        name: SOURCE_USER_NAME,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!importUser) {
      console.error(`❌ User "${SOURCE_USER_NAME}" nicht gefunden!`);
      process.exit(1);
    }

    console.log(`✅ Import User gefunden: ${importUser.name} (${importUser.email})`);
    console.log(`   ID: ${importUser.id}\n`);

    // Verifiziere Ziel-User
    const targetUser = await prisma.user.findUnique({
      where: {
        id: TARGET_USER_ID,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!targetUser) {
      console.error(`❌ Ziel-User mit ID "${TARGET_USER_ID}" nicht gefunden!`);
      process.exit(1);
    }

    console.log(`✅ Ziel-User gefunden: ${targetUser.name} (${targetUser.email})`);
    console.log(`   ID: ${targetUser.id}\n`);

    // Finde alle betroffenen Listings
    const listings = await prisma.listing.findMany({
      where: {
        location: LOCATION,
        ownerId: importUser.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        location: true,
        ownerId: true,
      },
    });

    console.log(`📊 Gefundene Listings: ${listings.length}\n`);

    if (listings.length === 0) {
      console.log("✅ Keine Listings zum Aktualisieren gefunden.");
      return;
    }

    // Zeige Vorschau
    console.log("📋 Betroffene Listings:");
    listings.forEach((listing, index) => {
      console.log(`   ${index + 1}. ${listing.title} (${listing.slug})`);
    });
    console.log();

    // Frage nach Bestätigung (in Production könnte man readline verwenden)
    console.log("⚠️  WICHTIG: Dieses Script wird die folgenden Änderungen vornehmen:");
    console.log(`   - ${listings.length} Listing(s) werden von "${importUser.name}" zu "${targetUser.name}" zugeordnet`);
    console.log(`   - Location: "${LOCATION}"`);
    console.log();

    // Für automatische Ausführung - in Production könnte man hier eine Bestätigung einbauen
    console.log("🔄 Starte Neuzuordnung...\n");

    let updated = 0;
    let errors = 0;

    for (const listing of listings) {
      try {
        await prisma.listing.update({
          where: { id: listing.id },
          data: {
            ownerId: targetUser.id,
          },
        });

        updated++;
        console.log(`✅ ${listing.title} → ${targetUser.name}`);
      } catch (error) {
        errors++;
        console.error(`❌ Fehler bei ${listing.title}:`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📊 Zusammenfassung:");
    console.log(`   ✅ Erfolgreich aktualisiert: ${updated}`);
    console.log(`   ❌ Fehler: ${errors}`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("❌ Fehler:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ausführung
reassignMuensterListings()
  .then(() => {
    console.log("\n✅ Script erfolgreich abgeschlossen!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script fehlgeschlagen:", error);
    process.exit(1);
  });

