import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
 
async function generateContent(term: string, tone?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }
  const prompt = [
    "Schreibe einen prägnanten, gut strukturierten Lexikon-Eintrag auf Deutsch.",
    `Begriff: "${term}"`,
    "Zielgruppe: Camper/Interessenten mit Grundkenntnissen.",
    "Stil: sachlich, verständlich, ohne Marketing-Sprache.",
    "Format: 2–4 Absätze mit klarer Definition, ggf. Anwendungsbeispiel und wichtigen Hinweisen.",
    tone ? `Zusätzlicher Ton/Hinweis: ${tone}` : undefined,
    "Verwende bei Bedarf Markdown-Formatierung (Überschriften vermeiden).",
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
  const data = await res.json();
  const content =
    data?.choices?.[0]?.message?.content ??
    "Entschuldigung, ich konnte keinen Vorschlag erzeugen.";
  return NextResponse.json({ content });
}

const termSchema = z.object({
  term: z.string().min(2),
  slug: z.string().min(2),
  content: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
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

    const term = await prisma.glossaryTerm.create({
      data: validatedData,
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

