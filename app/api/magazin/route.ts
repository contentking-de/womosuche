import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sanitizeAiHtml } from "@/lib/utils";

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
              { title: { contains: q, mode: "insensitive" as const } },
              { slug: { contains: q, mode: "insensitive" as const } },
              { content: { contains: q, mode: "insensitive" as const } },
              { excerpt: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {};

    const items = await prisma.article.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      select: { id: true, title: true, slug: true, published: true, categories: true },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Search articles error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

async function generateArticleContent(title: string, tone?: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }

  const prompt = [
    "Erstelle einen umfassenden Magazin-Artikel auf Deutsch als sauberes HTML (ohne <html>, <head>, <body>).",
    `Titel: "${title}"`,
    "Zielgruppe: Camper/Wohnmobil-Interessierte. Stil: informativ, neutral, präzise.",
    "Strukturiere mit <h2>/<h3>, Absätzen, Listen und optional Tabellen. Kein <h1>.",
    "Füge eine kurze Einleitung (1–3 Sätze) an, danach thematisch gegliederte Abschnitte.",
    "Liefere ausschließlich HTML zurück.",
    tone ? `Zusätzlicher Ton/Hinweis: ${tone}` : undefined,
  ]
    .filter(Boolean)
    .join("\\n");

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
      temperature: 0.4,
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

async function reformatArticleHtml(html: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY nicht konfiguriert." },
      { status: 500 }
    );
  }
  const prompt = [
    "Formatiere den folgenden Magazin-Artikel in SAUBERES HTML.",
    "WICHTIG: Inhaltlich NICHTS verändern – nur Struktur/Tags bereinigen.",
    "Regeln:",
    "- Nutze <h2> und <h3> für Überschriften, keine <h1>.",
    "- Verwende <p> für Absätze, <ul>/<ol> für Listen, <table> bei Tabellen.",
    "- Entferne überflüssige <span>, Inline-Styles, leere oder doppelte Tags.",
    "- Bewahre Links und sinnvolle Semantik.",
    "- Gib ausschließlich HTML zurück (ohne <html>/<body>).",
    "",
    "Artikel-HTML:",
    html,
  ].join("\\n");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Du bist ein sorgfältiger HTML-Redakteur und änderst keine Inhalte." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
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

const articleSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().min(10),
  tags: z.array(z.string()).default([]),
  published: z.boolean().default(false),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    if (body?.__action === "generate") {
      const title = typeof body?.title === "string" ? body.title : "";
      const tone = typeof body?.tone === "string" ? body.tone : undefined;
      if (!title || title.trim().length < 3) {
        return NextResponse.json(
          { error: "Parameter 'title' ist erforderlich." },
          { status: 400 }
        );
      }
      return await generateArticleContent(title, tone);
    }
    if (body?.__action === "reformat") {
      const html = typeof body?.html === "string" ? body.html : "";
      if (!html || html.trim().length < 3) {
        return NextResponse.json(
          { error: "Parameter 'html' ist erforderlich." },
          { status: 400 }
        );
      }
      return await reformatArticleHtml(html);
    }
    const validatedData = articleSchema.parse(body);

    // Prüfe ob Slug bereits existiert
    const existing = await prisma.article.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ein Artikel mit diesem Slug existiert bereits" },
        { status: 400 }
      );
    }

    const article = await prisma.article.create({
      data: validatedData,
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Create article error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

