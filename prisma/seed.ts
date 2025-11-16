import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateSlug } from "../lib/slug";

const prisma = new PrismaClient();

async function main() {
  // Erstelle Admin-User falls nicht vorhanden
  const adminEmail = process.env.ADMIN_EMAIL || "admin@wohnmobil.de";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
        role: "ADMIN",
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Admin-User erstellt: ${adminEmail}`);
  } else {
    console.log(`ℹ️  Admin-User existiert bereits: ${adminEmail}`);
  }

  // Erstelle Demo-Vermieter falls nicht vorhanden
  const landlordEmail = "vermieter@demo.de";
  let landlord = await prisma.user.findUnique({
    where: { email: landlordEmail },
  });

  if (!landlord) {
    const hashedPassword = await bcrypt.hash("demo123", 10);
    
    landlord = await prisma.user.create({
      data: {
        email: landlordEmail,
        name: "Max Mustermann",
        password: hashedPassword,
        role: "LANDLORD",
        emailVerified: new Date(),
      },
    });

    console.log(`✅ Demo-Vermieter erstellt: ${landlordEmail}`);
  } else {
    console.log(`ℹ️  Demo-Vermieter existiert bereits: ${landlordEmail}`);
  }

  // Erstelle Demo-Listing falls nicht vorhanden
  const listingSlug = generateSlug("Luxuriöses Wohnmobil für 4 Personen");
  const existingListing = await prisma.listing.findUnique({
    where: { slug: listingSlug },
  });

  if (!existingListing && landlord) {
    const listing = await prisma.listing.create({
      data: {
        ownerId: landlord.id,
        title: "Luxuriöses Wohnmobil für 4 Personen",
        slug: listingSlug,
        description: `Dieses moderne und komfortable Wohnmobil bietet alles, was Sie für einen unvergesslichen Camping-Urlaub benötigen. 

**Ausstattung:**
- Vollständig ausgestattete Küche mit Kühlschrank, Herd und Spüle
- Gemütliches Wohnzimmer mit ausklappbarem Tisch
- Zwei separate Schlafbereiche
- Badezimmer mit Dusche und WC
- Klimaanlage und Heizung
- Solaranlage für autarkes Camping
- Außendusche und Markise

**Technische Daten:**
- Länge: 7,5m
- Breite: 2,3m
- Höhe: 2,9m
- Zuladung: 500kg
- Verbrauch: ca. 10-12 Liter/100km

Perfekt für Familien oder Gruppen bis zu 4 Personen. Ideal für Wochenendausflüge oder längere Reisen durch Deutschland und Europa.`,
        pricePerDay: 89,
        seats: 4,
        beds: 4,
        location: "München, Bayern",
        features: [
          "Klimaanlage",
          "Heizung",
          "Solaranlage",
          "Außendusche",
          "Markise",
          "Küchenausstattung",
          "Badezimmer",
          "WLAN",
        ],
        published: true,
      },
    });

    // Erstelle Demo-Bilder (Placeholder URLs - in Produktion würden diese zu Vercel Blob zeigen)
    await prisma.image.createMany({
      data: [
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop",
          alt: "Wohnmobil Außenansicht",
        },
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1605540436563-5bca91984b30?w=800&h=600&fit=crop",
          alt: "Wohnmobil Innenraum",
        },
        {
          listingId: listing.id,
          url: "https://images.unsplash.com/photo-1605540436563-5bca91984b30?w=800&h=600&fit=crop",
          alt: "Wohnmobil Küche",
        },
      ],
    });

    console.log(`✅ Demo-Listing erstellt: ${listing.title}`);
  } else {
    console.log(`ℹ️  Demo-Listing existiert bereits`);
  }

  // Erstelle Demo-GlossaryTerm falls nicht vorhanden
  const glossarySlug = generateSlug("Stellplatz");
  const existingGlossary = await prisma.glossaryTerm.findUnique({
    where: { slug: glossarySlug },
  });

  if (!existingGlossary) {
    await prisma.glossaryTerm.create({
      data: {
        term: "Stellplatz",
        slug: glossarySlug,
        content: `Ein **Stellplatz** ist ein ausgewiesener Platz zum Abstellen und Übernachten eines Wohnmobils oder Wohnwagens.

## Merkmale eines Stellplatzes:

- **Basisausstattung**: Meist mit Stromanschluss, Frischwasser- und Abwasserentsorgung
- **Größe**: Ausreichend Platz für das Fahrzeug und eventuell eine Markise
- **Lage**: Oft in der Nähe von Sehenswürdigkeiten, Städten oder Naturgebieten
- **Preis**: Günstiger als ein Campingplatz, oft zwischen 10-25€ pro Nacht

## Unterschied zum Campingplatz:

Während ein Campingplatz meist umfangreichere Einrichtungen wie Sanitäranlagen, Geschäfte und Freizeitmöglichkeiten bietet, ist ein Stellplatz einfacher ausgestattet und fokussiert sich auf das reine Abstellen des Fahrzeugs.

Stellplätze sind besonders beliebt bei Reisenden, die eine einfache und kostengünstige Übernachtungsmöglichkeit suchen.`,
      },
    });

    console.log(`✅ Demo-GlossaryTerm erstellt: Stellplatz`);
  } else {
    console.log(`ℹ️  Demo-GlossaryTerm existiert bereits`);
  }

  // Erstelle Demo-Article falls nicht vorhanden
  const articleSlug = generateSlug("Die besten Camping-Tipps für Anfänger");
  const existingArticle = await prisma.article.findUnique({
    where: { slug: articleSlug },
  });

  if (!existingArticle) {
    await prisma.article.create({
      data: {
        title: "Die besten Camping-Tipps für Anfänger",
        slug: articleSlug,
        excerpt: "Entdecken Sie die wichtigsten Tipps und Tricks für einen gelungenen Camping-Urlaub mit dem Wohnmobil. Von der Planung bis zur praktischen Umsetzung.",
        content: `# Die besten Camping-Tipps für Anfänger

Camping mit dem Wohnmobil ist eine wunderbare Art, die Natur zu erleben und gleichzeitig den Komfort eines mobilen Zuhauses zu genießen. Wenn Sie neu im Camping sind, können diese Tipps Ihnen helfen, Ihren ersten Urlaub zu einem unvergesslichen Erlebnis zu machen.

## 1. Planung ist alles

Bevor Sie losfahren, sollten Sie Ihre Route und Übernachtungsplätze planen. Besonders in der Hauptsaison können beliebte Stellplätze schnell ausgebucht sein.

**Tipps:**
- Reservieren Sie Stellplätze im Voraus
- Informieren Sie sich über lokale Vorschriften
- Planen Sie alternative Routen ein

## 2. Die richtige Ausstattung

Nicht alles ist notwendig, aber einige Dinge machen das Camping deutlich angenehmer:

**Essentiell:**
- Erste-Hilfe-Kasten
- Taschenlampe oder Laterne
- Werkzeug für kleine Reparaturen
- Kartenmaterial (auch offline verfügbar)

**Nützlich:**
- Campingstühle und Tisch
- Markise für Schatten
- Kühlbox oder Kühlschrank
- Geschirr und Besteck

## 3. Sicherheit geht vor

**Wichtige Sicherheitsaspekte:**
- Überprüfen Sie regelmäßig die technischen Systeme
- Halten Sie einen Feuerlöscher bereit
- Informieren Sie Familie oder Freunde über Ihre Route
- Beachten Sie lokale Geschwindigkeitsbegrenzungen

## 4. Respekt für die Natur

Als Camper tragen Sie Verantwortung für die Umwelt:

- Hinterlassen Sie keinen Müll
- Nutzen Sie ausgewiesene Stellplätze
- Respektieren Sie die Tierwelt
- Verwenden Sie umweltfreundliche Reinigungsmittel

## 5. Budget im Blick behalten

Camping kann günstig sein, aber Kosten können sich summieren:

- Stellplatzgebühren
- Treibstoff
- Lebensmittel
- Aktivitäten vor Ort

Planen Sie ein Budget und halten Sie sich daran.

## Fazit

Camping mit dem Wohnmobil ist eine großartige Möglichkeit, die Welt zu erkunden. Mit der richtigen Vorbereitung und diesen Tipps steht einem unvergesslichen Abenteuer nichts im Wege.

Viel Spaß beim Camping! 🚐✨`,
        tags: ["Anfänger", "Tipps", "Camping", "Wohnmobil"],
        published: true,
      },
    });

    console.log(`✅ Demo-Article erstellt: Die besten Camping-Tipps für Anfänger`);
  } else {
    console.log(`ℹ️  Demo-Article existiert bereits`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

