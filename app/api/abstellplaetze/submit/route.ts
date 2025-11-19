import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateSlug } from "@/lib/slug";
import { sendNewParkingSubmissionNotificationToAdmins } from "@/lib/email";
import { randomUUID } from "crypto";

const parkingSubmissionSchema = z.object({
  title: z.string().min(3),
  location: z.string().min(3),
  postalCode: z.string().regex(/^\d{5}$/),
  description: z.string().min(10),
  submitterName: z.string().min(2),
  submitterEmail: z.string().email(),
  submitterPhone: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = parkingSubmissionSchema.parse(body);

    // Generiere einen Slug aus dem Titel
    const baseSlug = generateSlug(data.title);
    
    // Stelle sicher, dass der Slug eindeutig ist
    let slug = baseSlug;
    let counter = 1;
    while (true) {
      const existing = await prisma.article.findUnique({
        where: { slug },
      });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Erstelle die Postleitzahl-Kategorie
    const postalCodeCategory = `Postleitzahl ${data.postalCode}-${data.postalCode}`;

    // Generiere UUID für den Artikel
    const articleId = randomUUID();
    const now = new Date();

    // Erstelle einen unveröffentlichten Artikel mit den Einreichungsdaten
    const article = await prisma.article.create({
      data: {
        id: articleId,
        title: data.title,
        slug,
        excerpt: `${data.location} - ${data.description.substring(0, 150)}...`,
        content: `<h2>Abstellplatz Details</h2>
<p><strong>Standort:</strong> ${data.location}</p>
<p><strong>Postleitzahl:</strong> ${data.postalCode}</p>
<h2>Beschreibung</h2>
<p>${data.description.replace(/\n/g, '<br>')}</p>
<h2>Kontakt</h2>
<p>Dieser Abstellplatz wurde eingereicht von: ${data.submitterName} (${data.submitterEmail}${data.submitterPhone ? `, ${data.submitterPhone}` : ''})</p>`,
        categories: [postalCodeCategory],
        tags: ["Wohnmobil Abstellplatz", `Abstellplatz ${data.location.split(',')[0]}`],
        published: false,
        editorId: null,
        updatedAt: now,
      },
    });

    // Sende Benachrichtigung an alle Admins (asynchron, nicht blockierend)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const articleUrl = `${baseUrl}/dashboard/magazin/${article.id}`;

    sendNewParkingSubmissionNotificationToAdmins({
      parkingTitle: data.title,
      location: data.location,
      postalCode: data.postalCode,
      description: data.description,
      submitterName: data.submitterName,
      submitterEmail: data.submitterEmail,
      submitterPhone: data.submitterPhone,
      articleUrl,
    }).catch((error) => {
      console.error("Fehler beim Senden der Admin-Benachrichtigung:", error);
      // Nicht werfen, da Artikel bereits erstellt wurde
    });

    return NextResponse.json(
      { 
        message: "Abstellplatz erfolgreich eingereicht", 
        articleId: article.id 
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Submit parking space error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

