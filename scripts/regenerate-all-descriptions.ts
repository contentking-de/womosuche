/* eslint-disable no-console */
import { prisma } from "../lib/prisma";
import { sanitizeAiHtml } from "../lib/utils";

// Formatiere Equipment-Daten für den Prompt
function formatEquipmentDetails(equipment: any): string {
  if (!equipment) return "Keine detaillierten Ausstattungsdaten angegeben";
  
  const equipmentDetails: string[] = [];
  const eq = equipment;
  
  // Allgemeine Fahrzeugdaten
  if (eq.vehicleType) equipmentDetails.push(`Fahrzeugtyp: ${eq.vehicleType}`);
  if (eq.year) equipmentDetails.push(`Baujahr: ${eq.year}`);
  if (eq.length) equipmentDetails.push(`Länge: ${eq.length} cm`);
  if (eq.transmission) equipmentDetails.push(`Getriebe: ${eq.transmission}`);
  if (eq.fuelType) equipmentDetails.push(`Kraftstoff: ${eq.fuelType}`);
  if (eq.fuelConsumption) equipmentDetails.push(`Verbrauch: ${eq.fuelConsumption}`);
  
  // Schlafen
  if (eq.bedTypes && eq.bedTypes.length > 0) equipmentDetails.push(`Betttypen: ${eq.bedTypes.join(", ")}`);
  if (eq.bedSizes && eq.bedSizes.length > 0) equipmentDetails.push(`Bettgrößen: ${eq.bedSizes.join(", ")}`);
  if (eq.sleepPlaces) equipmentDetails.push(`Schlafplätze: ${eq.sleepPlaces}`);
  
  // Küche
  if (eq.stove) equipmentDetails.push(`Herd: ${eq.stove}`);
  if (eq.refrigerator) equipmentDetails.push(`Kühlschrank: ${eq.refrigerator}`);
  if (eq.oven) equipmentDetails.push("Backofen: vorhanden");
  if (eq.microwave) equipmentDetails.push("Mikrowelle: vorhanden");
  if (eq.gasSupply) equipmentDetails.push(`Gasversorgung: ${eq.gasSupply}`);
  
  // Bad
  if (eq.shower) equipmentDetails.push("Dusche: vorhanden");
  if (eq.toilet) equipmentDetails.push(`Toilette: ${eq.toilet}`);
  if (eq.hotWater) equipmentDetails.push("Warmwasser: vorhanden");
  
  // Technik & Energie
  if (eq.freshWaterTank) equipmentDetails.push(`Frischwassertank: ${eq.freshWaterTank} Liter`);
  if (eq.wasteWaterTank) equipmentDetails.push(`Abwassertank: ${eq.wasteWaterTank} Liter`);
  if (eq.heating) equipmentDetails.push(`Heizung: ${eq.heating}`);
  if (eq.airConditioning) equipmentDetails.push(`Klimaanlage: ${eq.airConditioning}`);
  if (eq.solarPower) equipmentDetails.push(`Solaranlage: ${eq.solarPower} Watt`);
  if (eq.inverter) equipmentDetails.push("Wechselrichter: vorhanden");
  if (eq.shorePower) equipmentDetails.push("Landstromanschluss: vorhanden");
  
  // Innenraum & Komfort
  if (eq.seating) equipmentDetails.push(`Sitzgruppe: ${eq.seating}`);
  if (eq.swivelSeats) equipmentDetails.push("Drehsitze: vorhanden");
  if (eq.tv) equipmentDetails.push("TV: vorhanden");
  if (eq.satellite) equipmentDetails.push("Satellitenanlage: vorhanden");
  if (eq.usbPorts) equipmentDetails.push("USB-Anschlüsse: vorhanden");
  if (eq.blinds) equipmentDetails.push("Verdunkelung: vorhanden");
  if (eq.storage && eq.storage.length > 0) equipmentDetails.push(`Stauraum: ${eq.storage.join(", ")}`);
  
  // Außen & Campingzubehör
  if (eq.awning) equipmentDetails.push("Markise: vorhanden");
  if (eq.bikeRack) equipmentDetails.push(`Fahrradträger: ${eq.bikeRack}`);
  if (eq.towbar) equipmentDetails.push("Anhängerkupplung: vorhanden");
  if (eq.campingFurniture) equipmentDetails.push("Campingmöbel: vorhanden");
  if (eq.outdoorShower) equipmentDetails.push("Außendusche: vorhanden");
  
  return equipmentDetails.length > 0 
    ? equipmentDetails.join("\n")
    : "Keine detaillierten Ausstattungsdaten angegeben";
}

async function generateListingDescription(data: {
  title?: string;
  location?: string;
  pricePerDay?: number;
  seats?: number;
  beds?: number;
  features?: string[];
  marke?: string;
  equipment?: any;
  existingDescription?: string;
}): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY nicht konfiguriert.");
  }

  const featuresList = data.features && data.features.length > 0 
    ? data.features.join(", ")
    : "Keine speziellen Ausstattungsmerkmale angegeben";

  const equipmentList = formatEquipmentDetails(data.equipment);

  const prompt = [
    "Erstelle eine ansprechende, verkaufsfördernde und emotionale Beschreibung für ein Wohnmobil auf Deutsch.",
    "",
    "=== GRUNDDATEN ===",
    data.title ? `Titel: "${data.title}"` : undefined,
    data.marke ? `Marke: ${data.marke}` : undefined,
    data.location ? `Standort: ${data.location}` : undefined,
    data.pricePerDay ? `Preis pro Tag: ${data.pricePerDay}€` : undefined,
    data.seats ? `Sitzplätze: ${data.seats}` : undefined,
    data.beds ? `Betten: ${data.beds}` : undefined,
    "",
    "=== AUSSTATTUNGSMERKMALE ===",
    `Besondere Features: ${featuresList}`,
    "",
    "=== DETAILLIERTE AUSSTATTUNG ===",
    equipmentList,
    "",
    "WICHTIG: Nutze die oben genannten Informationen (Titel, Marke, Ausstattungsmerkmale und detaillierte Ausstattung) aktiv in der Beschreibung. Erwähne konkrete Details wie Marke, Fahrzeugtyp, besondere Ausstattungsmerkmale und technische Details, um die Beschreibung authentisch und informativ zu gestalten.",
    "",
    "WICHTIG: Verwende IMMER informale Sprache (Du-Form, nicht Sie-Form).",
    "",
    "Die Beschreibung soll:",
    "- Emotional und begeisternd sein - wecke die Vorfreude auf unvergessliche Reiseerlebnisse",
    "- Die Vorteile des Mietens dieses Wohnmobils hervorheben",
    "- Die Aussicht auf tolle Reiseerlebnisse mit Familie oder Freunden verdeutlichen",
    "- Die Freiheit und Flexibilität des Wohnmobil-Urlaubs betonen",
    "- Die wichtigsten Merkmale und Ausstattung erwähnen",
    "- Den Standort und seine Vorteile beschreiben",
    "- Zum Mieten einladen und die Vorfreude wecken",
    "- Lockere, umgangssprachliche und persönliche Sprache verwenden",
    "- Du-Form durchgehend verwenden (z.B. 'Du kannst...', 'Dir steht...', 'Du erlebst...', 'Du genießt...')",
    "- Keine formale oder steife Sprache",
    "- Positive, motivierende Formulierungen verwenden",
    "",
    "Format: HTML mit <p> Tags für jeden Absatz. Jeder Absatz muss in <p>...</p> eingeschlossen sein.",
    "Beispiel: <p>Erster Absatz...</p><p>Zweiter Absatz...</p>",
    "Länge: 4-6 Absätze, insgesamt etwa 200-300 Wörter.",
    "Struktur:",
    "- Beginne mit einer emotionalen Einleitung über die Reiseerlebnisse",
    "- Beschreibe die Vorteile und Ausstattung",
    "- Erwähne die Möglichkeiten für Familie/Freunde",
    "- Schließe mit einer einladenden Aufforderung zum Mieten",
    data.existingDescription 
      ? `\nAktuelle Beschreibung zum Überarbeiten:\n${data.existingDescription}\n\nBitte überarbeite diese Beschreibung und verbessere sie mit emotionaler Ansprache, betone die Vorteile und Reiseerlebnisse. Verwende dabei informale Sprache (Du-Form) und strukturiere den Text mit <p> Tags.`
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein professioneller Texter für Wohnmobil-Vermietungen. Du verwendest immer informale Sprache (Du-Form) und lockere, umgangssprachliche Formulierungen." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`KI-Anfrage fehlgeschlagen: ${err}`);
  }

  const responseData = await res.json();
  const raw = responseData?.choices?.[0]?.message?.content ?? 
    "Entschuldigung, ich konnte keine Beschreibung generieren.";
  
  // HTML-Bereinigung
  let description = sanitizeAiHtml(raw);
  
  // Füge H2-Überschrift am Anfang hinzu, wenn ein Titel vorhanden ist
  if (data.title) {
    const h2Title = `<h2>${data.title} mieten</h2>`;
    // Entferne eventuell vorhandene H2-Überschrift am Anfang
    description = description.trim();
    // Prüfe, ob bereits eine H2-Überschrift am Anfang steht
    if (description.startsWith("<h2>")) {
      // Finde das Ende der ersten H2-Überschrift
      const h2EndIndex = description.indexOf("</h2>");
      if (h2EndIndex !== -1) {
        // Entferne die alte H2-Überschrift
        description = description.substring(h2EndIndex + 5).trim();
      }
    }
    // Füge die neue H2-Überschrift am Anfang hinzu
    description = h2Title + "\n\n" + description;
  }
  
  return description;
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const startIdIndex = args.indexOf("--startId");
  const startId = startIdIndex !== -1 && args[startIdIndex + 1] ? args[startIdIndex + 1] : null;

  if (startId) {
    console.log(`🚀 Starte Neugenerierung ab ID: ${startId}\n`);
  } else {
    console.log("🚀 Starte Neugenerierung aller Wohnmobile-Beschreibungen...\n");
  }

  try {
    // Lade alle Listings
    const allListings = await prisma.listing.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log(`📋 Gefunden: ${allListings.length} Wohnmobile insgesamt\n`);

    if (allListings.length === 0) {
      console.log("Keine Wohnmobile gefunden.");
      return;
    }

    // Filtere Listings basierend auf Start-ID
    let listings: typeof allListings;
    let startIndex = 0;

    if (startId) {
      // Finde den Index der Start-ID
      const foundIndex = allListings.findIndex(l => l.id === startId);
      if (foundIndex === -1) {
        console.error(`❌ Fehler: ID "${startId}" nicht gefunden!`);
        console.log("\nVerfügbare IDs (erste 10):");
        allListings.slice(0, 10).forEach((l, i) => {
          console.log(`  ${i + 1}. ${l.title} (ID: ${l.id})`);
        });
        process.exit(1);
      }
      // Starte mit dem NÄCHSTEN Listing nach der Start-ID
      startIndex = foundIndex + 1;
      listings = allListings.slice(startIndex);
      console.log(`📍 Starte bei Index ${startIndex + 1} (nach ID: ${startId})`);
      console.log(`📋 Verbleibend: ${listings.length} Wohnmobile\n`);
    } else {
      listings = allListings;
    }

    if (listings.length === 0) {
      console.log("Keine Wohnmobile zum Verarbeiten gefunden.");
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ id: string; title: string; error: string }> = [];

    // Verarbeite jedes Listing
    for (let i = 0; i < listings.length; i++) {
      const listing = listings[i];
      const globalIndex = startIndex + i + 1;
      console.log(`[${globalIndex}/${allListings.length}] Verarbeite: ${listing.title} (ID: ${listing.id})`);

      try {
        // Generiere neue Beschreibung
        const newDescription = await generateListingDescription({
          title: listing.title,
          location: listing.location,
          pricePerDay: listing.pricePerDay,
          seats: listing.seats,
          beds: listing.beds,
          features: listing.features,
          marke: (listing as any).marke,
          equipment: (listing as any).equipment,
          existingDescription: listing.description,
        });

        // Speichere neue Beschreibung
        await prisma.listing.update({
          where: { id: listing.id },
          data: { description: newDescription },
        });

        console.log(`  ✅ Erfolgreich aktualisiert (ID: ${listing.id})\n`);
        successCount++;

        // Kurze Pause zwischen API-Aufrufen, um Rate Limits zu vermeiden
        if (i < listings.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 Sekunde Pause
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
        console.error(`  ❌ Fehler: ${errorMessage}\n`);
        errorCount++;
        errors.push({
          id: listing.id,
          title: listing.title,
          error: errorMessage,
        });
      }
    }

    // Zusammenfassung
    console.log("\n" + "=".repeat(60));
    console.log("📊 Zusammenfassung:");
    console.log(`  ✅ Erfolgreich: ${successCount}`);
    console.log(`  ❌ Fehler: ${errorCount}`);
    if (listings.length > 0) {
      const lastProcessedId = listings[listings.length - 1].id;
      console.log(`  📍 Letzte verarbeitete ID: ${lastProcessedId}`);
      console.log(`  💡 Um fortzufahren, verwenden Sie: npm run regenerate:descriptions -- --startId "${lastProcessedId}"`);
    }
    console.log("=".repeat(60));

    if (errors.length > 0) {
      console.log("\n❌ Fehlerdetails:");
      errors.forEach(({ id, title, error }) => {
        console.log(`  - ${title} (${id}): ${error}`);
      });
    }

    console.log("\n✨ Fertig!");
  } catch (error) {
    console.error("❌ Kritischer Fehler:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

