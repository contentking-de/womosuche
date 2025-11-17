import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { parse } from "csv-parse/sync";

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
    const list = formData.get("list") as string;

    if (!file) {
      return NextResponse.json(
        { error: "Keine Datei hochgeladen" },
        { status: 400 }
      );
    }

    if (!list || !["NEWS", "REISEBERICHTE", "VERMIETUNGEN"].includes(list)) {
      return NextResponse.json(
        { error: "Ungültige Liste" },
        { status: 400 }
      );
    }

    const fileContent = await file.text();
    
    // Parse CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Unterstütze BOM (Byte Order Mark) für UTF-8
    });

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "CSV-Datei ist leer oder ungültig" },
        { status: 400 }
      );
    }

    console.log(`CSV importiert: ${records.length} Zeilen gefunden`);
    if (records.length > 0) {
      console.log("Erste Zeile Beispiel:", Object.keys(records[0]));
    }

    let imported = 0;
    let updated = 0;
    let errors: string[] = [];

    for (const record of records) {
      // Unterstütze verschiedene Spaltennamen-Varianten
      const emailRaw = record.email || record.Email || record.EMAIL || record["E-Mail"] || record["e-mail"] || record["E-mail"];
      
      // Entferne Anführungszeichen und trimme
      const email = emailRaw ? String(emailRaw).replace(/^["']|["']$/g, "").trim() : null;
      
      // Unterstütze verschiedene Namens-Spaltennamen
      let nameRaw = record.name || record.Name || record.NAME || null;
      
      // Wenn kein Name gefunden, versuche Vorname und Nachname zu kombinieren
      if (!nameRaw) {
        const vornameRaw = record.Vorname || record.vorname || record["Vorname"] || "";
        const nachnameRaw = record.Nachname || record.nachname || record["Nachname"] || "";
        if (vornameRaw || nachnameRaw) {
          const vorname = String(vornameRaw).replace(/^["']|["']$/g, "").trim();
          const nachname = String(nachnameRaw).replace(/^["']|["']$/g, "").trim();
          nameRaw = [vorname, nachname].filter(Boolean).join(" ").trim() || null;
        }
      }
      
      const name = nameRaw ? String(nameRaw).replace(/^["']|["']$/g, "").trim() || null : null;

      if (!email || email === "") {
        errors.push(`Zeile ohne E-Mail-Adresse übersprungen (Spalten: ${Object.keys(record).join(", ")})`);
        continue;
      }

      // Validiere E-Mail
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Ungültige E-Mail-Adresse: ${email}`);
        continue;
      }

      try {
        const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
          where: { email: email.toLowerCase().trim() },
        });

        if (existingSubscriber) {
          // Aktualisiere bestehenden Subscriber
          const updatedLists = Array.from(
            new Set([...existingSubscriber.lists, list as "NEWS" | "REISEBERICHTE" | "VERMIETUNGEN"])
          );

          await prisma.newsletterSubscriber.update({
            where: { email: email.toLowerCase().trim() },
            data: {
              lists: updatedLists,
              name: name || existingSubscriber.name,
              // Wenn abgemeldet, wieder aktivieren
              unsubscribedAt: null,
            },
          });
          updated++;
        } else {
          // Erstelle neuen Subscriber
          await prisma.newsletterSubscriber.create({
            data: {
              email: email.toLowerCase().trim(),
              name: name,
              lists: [list as "NEWS" | "REISEBERICHTE" | "VERMIETUNGEN"],
              confirmed: true, // CSV-Importierte sind als bestätigt markiert
              confirmedAt: new Date(),
            },
          });
          imported++;
        }
      } catch (error) {
        errors.push(`Fehler bei ${email}: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`);
      }
    }

    return NextResponse.json({
      imported,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten beim Importieren" },
      { status: 500 }
    );
  }
}

