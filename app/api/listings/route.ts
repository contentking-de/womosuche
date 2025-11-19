import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateUniqueSlug } from "@/lib/slug";
import { geocodeLocation } from "@/lib/geocode";
import { sanitizeAiHtml } from "@/lib/utils";
import { sendNewListingNotificationToAdmins } from "@/lib/email";
import { z } from "zod";
import { randomUUID } from "crypto";

const listingSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  pricePerDay: z.number().min(1),
  seats: z.number().min(1),
  beds: z.number().min(1),
  location: z.string().min(2),
  features: z.array(z.string()).default([]),
  marke: z.string().optional(),
  equipment: z.any().optional(), // JSON-Feld für strukturierte Ausstattungsdaten
  published: z.boolean().default(false),
  ownerId: z.string().optional(),
});

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
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }

  const featuresList = data.features && data.features.length > 0 
    ? data.features.join(", ")
    : "Keine speziellen Ausstattungsmerkmale angegeben";

  // Formatiere Equipment-Daten für den Prompt
  const equipmentDetails: string[] = [];
  if (data.equipment) {
    const eq = data.equipment;
    
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
  }
  
  const equipmentList = equipmentDetails.length > 0 
    ? equipmentDetails.join("\n")
    : "Keine detaillierten Ausstattungsdaten angegeben";

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
    return NextResponse.json(
      { error: "KI-Anfrage fehlgeschlagen", details: err },
      { status: 502 }
    );
  }

  const responseData = await res.json();
  const raw = responseData?.choices?.[0]?.message?.content ?? 
    "Entschuldigung, ich konnte keine Beschreibung generieren.";
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
  
  return NextResponse.json({ description });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    
    // Handle AI generation request
    if (body?.__action === "generate") {
      const generateData = {
        title: typeof body?.title === "string" ? body.title : undefined,
        location: typeof body?.location === "string" ? body.location : undefined,
        pricePerDay: typeof body?.pricePerDay === "number" ? body.pricePerDay : undefined,
        seats: typeof body?.seats === "number" ? body.seats : undefined,
        beds: typeof body?.beds === "number" ? body.beds : undefined,
        features: Array.isArray(body?.features) ? body.features : undefined,
        marke: typeof body?.marke === "string" ? body.marke : undefined,
        equipment: body?.equipment && typeof body.equipment === "object" ? body.equipment : undefined,
        existingDescription: typeof body?.existingDescription === "string" ? body.existingDescription : undefined,
      };
      return await generateListingDescription(generateData);
    }

    const validatedData = listingSchema.parse(body);

    // Generiere eindeutigen Slug
    const slug = await generateUniqueSlug(
      validatedData.title,
      async (slug) => {
        const existing = await prisma.listing.findUnique({
          where: { slug },
        });
        return !existing;
      }
    );

    // Geocode Location (im Hintergrund, blockiert nicht die Antwort)
    const coordinates = await geocodeLocation(validatedData.location).catch(
      () => null
    );

    // Bestimme ownerId: Admin kann ownerId setzen, sonst aktueller User
    let finalOwnerId = session.user.id;
    if (session.user.role === "ADMIN" && validatedData.ownerId) {
      // Prüfe ob User existiert
      const owner = await prisma.user.findUnique({
        where: { id: validatedData.ownerId },
      });
      if (!owner) {
        return NextResponse.json(
          { error: "Vermieter nicht gefunden" },
          { status: 400 }
        );
      }
      finalOwnerId = validatedData.ownerId;
    }

    // LANDLORDS können nur Entwürfe erstellen - published immer false setzen
    const finalPublished = session.user.role === "ADMIN" 
      ? validatedData.published 
      : false;

    // Generiere UUID für das Listing
    const listingId = randomUUID();
    const now = new Date();

    const listing = await prisma.listing.create({
      data: {
        id: listingId,
        ...validatedData,
        published: finalPublished,
        slug,
        ownerId: finalOwnerId,
        lat: coordinates?.lat ?? null,
        lng: coordinates?.lng ?? null,
        updatedAt: now,
      },
    });

    // Sende Benachrichtigung an alle Admins, wenn ein LANDLORD ein Wohnmobil erstellt hat
    if (session.user.role === "LANDLORD") {
      const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const listingUrl = `${baseUrl}/dashboard/listings/${listing.id}`;
      
      // Lade Landlord-Informationen
      const landlord = await prisma.user.findUnique({
        where: { id: finalOwnerId },
        select: {
          name: true,
          email: true,
        },
      });

      // Sende E-Mail asynchron (nicht blockierend)
      sendNewListingNotificationToAdmins({
        listingTitle: listing.title,
        landlordName: landlord?.name || null,
        landlordEmail: landlord?.email || session.user.email || "",
        listingUrl,
      }).catch((error) => {
        console.error("Fehler beim Senden der Admin-Benachrichtigung:", error);
        // Nicht werfen, da Listing bereits erstellt wurde
      });
    }

    return NextResponse.json(listing, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create listing error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

