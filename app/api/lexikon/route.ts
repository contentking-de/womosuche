import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeAiHtml } from "@/lib/utils";
import { randomUUID } from "crypto";
 
async function generateContent(term: string, tone?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }
  const prompt = [
    "Erstelle einen umfassenden, sachlichen, Wikipedia-ähnlichen Lexikonartikel auf Deutsch über den folgenden Fachbegriff aus dem Camping/Wohnmobil-Kontext.",
    `Fachbegriff: "${term}"`,
    "",
    "Zielgruppe: Camper und Interessenten mit Grundkenntnissen.",
    "Stil: neutral, fachlich, präzise, ohne Marketing-Sprache.",
    "",
    "STRUKTUR: Erstelle eine logische, natürliche Struktur, die perfekt zu diesem spezifischen Begriff passt.",
    "Analysiere den Begriff gründlich und strukturiere den Artikel so, wie es für diesen Begriff am sinnvollsten ist.",
    "Verwende <h2> für Hauptabschnitte und <h3> für Unterabschnitte. Erfinde keine Abschnitte, die für diesen Begriff nicht relevant sind.",
    "Beispiel: Für einen einfachen Begriff wie 'Angles Morts' (tote Winkel) macht ein Abschnitt 'Vor- und Nachteile' keinen Sinn - erkläre stattdessen, was es ist, wo es auftritt, warum es gefährlich ist und wie man damit umgeht.",
    "",
    "Ausgabeformat: Gib reines HTML zurück (ohne <html>, <head>, <body> oder <h1>).",
    "Verwende ausschließlich <h2> und <h3> für Überschriften, Absätze (<p>), Listen (<ul>/<ol>), Tabellen (<table> mit <thead>/<tbody>/<tr>/<th>/<td>) und bei Bedarf <blockquote>/<code>.",
    "",
    tone ? `Zusätzlicher Ton/Hinweis: ${tone}` : undefined,
    "",
    "FAQ: Füge am Ende eine Sektion <section id=\"faq\"> hinzu mit <h2>FAQ</h2> und genau fünf häufig gestellten Fragen. Für jede Frage nutze <h3>Frage</h3> und darunter eine ausführliche Antwort in <p>…</p>.",
    "FAQ-Schema: Direkt NACH der FAQ-Sektion füge einen <script type=\"application/ld+json\"> Block mit validem JSON-LD hinzu, der ein Objekt vom Typ \"FAQPage\" enthält. Liste darin dieselben fünf Fragen unter \"mainEntity\" als Array von \"Question\"-Objekten mit \"acceptedAnswer\" (Typ \"Answer\") und dem Antworttext unter \"text\". Gib nur gültiges JSON im Script-Tag aus, ohne Backticks.",
    "",
    "Wichtig: Keine Meta-Erklärungen, keine Einleitung über den Auftrag, kein <h1>. Gib ausschließlich den HTML-Inhalt zurück.",
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
        { role: "system", content: "Du bist ein präziser, hilfreicher Redakteur." },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "KI-Anfrage fehlgeschlagen", details: err },
      { status: 502 }
    );
  }
  const data = await res.json();
  const raw =
    data?.choices?.[0]?.message?.content ??
    "Entschuldigung, ich konnte keinen Vorschlag erzeugen.";
  const content = sanitizeAiHtml(raw);
  return NextResponse.json({ content });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const takeParam = searchParams.get("take");
    const take = Math.min(Math.max(parseInt(takeParam || "12", 10) || 12, 1), 50);

    const where =
      q.length > 0
        ? {
            OR: [
              { term: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};

    const terms = await prisma.glossaryTerm.findMany({
      where,
      orderBy: { term: "asc" },
      take,
      select: { term: true, slug: true, id: true },
    });

    return NextResponse.json({ items: terms });
  } catch (error) {
    console.error("Search terms error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

const termSchema = z.object({
  term: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.__action === "generate") {
      const term = typeof body?.term === "string" ? body.term : "";
      const tone = typeof body?.tone === "string" ? body.tone : undefined;
      if (!term || term.trim().length < 2) {
        return NextResponse.json(
          { error: "Parameter 'term' ist erforderlich." },
          { status: 400 }
        );
      }
      return await generateContent(term, tone);
    }

    const validatedData = termSchema.parse(body);

    // Prüfe ob Slug bereits existiert
    const existing = await prisma.glossaryTerm.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ein Begriff mit diesem Slug existiert bereits" },
        { status: 400 }
      );
    }

    const now = new Date();
    const term = await prisma.glossaryTerm.create({
      data: {
        ...validatedData,
        id: randomUUID(),
        updatedAt: now,
      },
    });

    return NextResponse.json(term, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create term error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

