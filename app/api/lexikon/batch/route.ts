import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateSlug, generateUniqueSlug } from "@/lib/slug";
import { sanitizeAiHtml } from "@/lib/utils";
import { z } from "zod";
import { randomUUID } from "crypto";

const batchSchema = z.object({
  terms: z.array(z.string().min(2)).min(1),
});

async function generateContent(term: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY nicht konfiguriert.");
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
    "FAQ: Füge am Ende eine Sektion <section id=\"faq\"> hinzu mit <h2>FAQ</h2> und genau fünf häufig gestellten Fragen. Für jede Frage nutze <h3>Frage</h3> und darunter eine ausführliche Antwort in <p>…</p>.",
    "FAQ-Schema: Direkt NACH der FAQ-Sektion füge einen <script type=\"application/ld+json\"> Block mit validem JSON-LD hinzu, der ein Objekt vom Typ \"FAQPage\" enthält. Liste darin dieselben fünf Fragen unter \"mainEntity\" als Array von \"Question\"-Objekten mit \"acceptedAnswer\" (Typ \"Answer\") und dem Antworttext unter \"text\". Gib nur gültiges JSON im Script-Tag aus, ohne Backticks.",
    "",
    "Wichtig: Keine Meta-Erklärungen, keine Einleitung über den Auftrag, kein <h1>. Gib ausschließlich den HTML-Inhalt zurück.",
  ].join("\n");

  try {
    // Timeout von 60 Sekunden für OpenAI API-Aufruf
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 Sekunden Timeout

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
        max_tokens: 2000, // Begrenze Token-Anzahl für schnellere Antworten
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.error(`OpenAI API error for term "${term}":`, err);
      return null;
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? null;
    
    if (!raw) {
      return null;
    }

    return sanitizeAiHtml(raw);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`OpenAI API timeout for term "${term}"`);
    } else {
      console.error(`Error generating content for term "${term}":`, error);
    }
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { terms } = batchSchema.parse(body);

    // Begrenze die Anzahl der Begriffe pro Batch, um Timeouts zu vermeiden
    // Vercel hat ein 300 Sekunden Limit, bei ~30-60 Sekunden pro Begriff (OpenAI API kann langsam sein)
    // sind max 10 Begriffe sicherer
    const MAX_TERMS_PER_BATCH = 10;
    if (terms.length > MAX_TERMS_PER_BATCH) {
      return NextResponse.json(
        { 
          error: `Zu viele Begriffe. Maximum sind ${MAX_TERMS_PER_BATCH} Begriffe pro Batch. Bitte teilen Sie die Liste auf.`,
          maxTerms: MAX_TERMS_PER_BATCH
        },
        { status: 400 }
      );
    }

    const results: Array<{
      term: string;
      success: boolean;
      slug?: string;
      error?: string;
    }> = [];

    // Verarbeite jeden Begriff sequenziell ohne zusätzliches Rate-Limiting
    // OpenAI hat eigene Rate Limits, zusätzliche Wartezeiten sind nicht nötig
    for (let i = 0; i < terms.length; i++) {
      const term = terms[i];
      
      try {
        // Prüfe ob Begriff bereits existiert
        const existing = await prisma.glossaryTerm.findFirst({
          where: {
            OR: [
              { term: { equals: term, mode: "insensitive" } },
              { slug: { equals: generateSlug(term), mode: "insensitive" } },
            ],
          },
        });

        if (existing) {
          results.push({
            term,
            success: false,
            error: `Begriff oder Slug existiert bereits: ${existing.term}`,
          });
          continue;
        }

        // Generiere Slug
        const slug = await generateUniqueSlug(
          term,
          async (s) => {
            const exists = await prisma.glossaryTerm.findUnique({
              where: { slug: s },
            });
            return !exists;
          }
        );

        // Generiere Inhalt mit KI
        const content = await generateContent(term);

        if (!content) {
          results.push({
            term,
            success: false,
            error: "KI-Generierung fehlgeschlagen",
          });
          continue;
        }

        // Erstelle Eintrag in der Datenbank
        const now = new Date();
        await prisma.glossaryTerm.create({
          data: {
            id: randomUUID(),
            term,
            slug,
            content,
            updatedAt: now,
          },
        });

        results.push({
          term,
          success: true,
          slug,
        });
      } catch (error) {
        console.error(`Error processing term "${term}":`, error);
        results.push({
          term,
          success: false,
          error: error instanceof Error ? error.message : "Unbekannter Fehler",
        });
      }
    }

    return NextResponse.json({
      message: `${results.filter((r) => r.success).length} von ${results.length} Begriffen erfolgreich erstellt`,
      results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Ungültige Eingabedaten", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Batch create terms error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

