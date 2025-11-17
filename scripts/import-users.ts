import { readFile } from "fs/promises";
import { parse } from "csv-parse/sync";
import bcrypt from "bcryptjs";
import path from "path";
import { prisma } from "../lib/prisma";

interface CSVUser {
  user_email: string;
  display_name: string;
  user_pass?: string;
}

async function importUsers(filePath: string) {
  try {
    const csvContent = await readFile(filePath, "utf8");
    
    // Parse CSV
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as CSVUser[];

    console.log(`📄 ${records.length} Zeilen in CSV gefunden`);

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    // Standard-Passwort für alle importierten User
    // User sollten dieses nach dem ersten Login ändern
    const defaultPassword = "womosuche2024!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    for (const record of records) {
      try {
        const email = record.user_email?.trim();
        const name = record.display_name?.trim() || email?.split("@")[0] || "Unbekannt";

        if (!email) {
          console.warn(`⚠️  Zeile übersprungen: Keine E-Mail-Adresse`);
          skipped++;
          continue;
        }

        // Validiere E-Mail-Format
        if (!email.includes("@") || !email.includes(".")) {
          console.warn(`⚠️  Ungültige E-Mail: ${email}`);
          skipped++;
          continue;
        }

        // Prüfe ob User bereits existiert
        const existing = await prisma.user.findUnique({
          where: { email },
        });

        if (existing) {
          // Update Name falls vorhanden und leer
          if (!existing.name && name) {
            await prisma.user.update({
              where: { email },
              data: { name },
            });
            updated++;
            console.log(`✏️  User aktualisiert: ${email} (Name: ${name})`);
          } else {
            skipped++;
            console.log(`⏭️  User existiert bereits: ${email}`);
          }
        } else {
          // Erstelle neuen User
          const user = await prisma.user.create({
            data: {
              email,
              name,
              password: hashedPassword,
              role: "LANDLORD",
            },
          });

          created++;
          console.log(`✅ User erstellt: ${email} (Name: ${name})`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ Fehler beim Import von ${record.user_email}:`, error);
      }
    }

    console.log(`\n📊 Import abgeschlossen:`);
    console.log(`  ✅ Erstellt: ${created}`);
    console.log(`  ✏️  Aktualisiert: ${updated}`);
    console.log(`  ⏭️  Übersprungen: ${skipped}`);
    console.log(`  ❌ Fehler: ${errors}`);
    console.log(`\n🔑 Standard-Passwort für alle neuen User: ${defaultPassword}`);
    console.log(`⚠️  Bitte informiere die User, dass sie ihr Passwort nach dem ersten Login ändern sollten.`);
  } catch (error) {
    console.error("❌ Fehler beim Lesen der CSV-Datei:", error);
    throw error;
  }
}

async function main() {
  try {
    const csvFile = path.join(process.cwd(), "public", "vermieter.csv");
    console.log(`📂 Lese CSV-Datei: ${csvFile}`);
    
    await importUsers(csvFile);
  } catch (error) {
    console.error("❌ Fehler:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

