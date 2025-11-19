"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Wie wähle ich das richtige Wohnmobil aus?",
    answer: "Bei der Auswahl des richtigen Wohnmobils solltest du mehrere Faktoren berücksichtigen: die Anzahl der Personen, die mitreisen, die gewünschte Ausstattung (z.B. Dusche, Toilette, Klimaanlage), die Größe des Fahrzeugs (für einfacheres Fahren und Parken) und natürlich dein Budget. Nutze unsere Filterfunktion, um nach diesen Kriterien zu suchen. Lies dir die detaillierten Beschreibungen und Bewertungen durch, um ein Gefühl für das Fahrzeug und den Vermieter zu bekommen. Bei Fragen kannst du jederzeit direkt Kontakt mit dem Vermieter aufnehmen.",
  },
  {
    question: "Was kostet es eine Wohnmobil oder einen Camper zu mieten?",
    answer: "Die Mietpreise variieren je nach Fahrzeugtyp, Ausstattung, Saison und Mietdauer. Grundsätzlich kannst du mit Preisen ab etwa 50-80 Euro pro Tag für einfache Camper rechnen, während größere, vollausgestattete Wohnmobile oft zwischen 100-200 Euro pro Tag kosten. In der Hauptsaison (Sommer, Feiertage) können die Preise höher sein. Zusätzlich zu den Mietkosten solltest du auch Kosten für Kraftstoff, Stellplätze, Versicherung (falls nicht inklusive) und eventuelle Kautionen einplanen. Die genauen Preise findest du bei jedem einzelnen Fahrzeug in der Übersicht.",
  },
  {
    question: "Sind Mietfahrzeuge automatisch versichert?",
    answer: "Die meisten Vermieter bieten eine Grundversicherung an, die in den Mietkosten enthalten ist. Diese deckt in der Regel Haftpflicht- und Teilkaskoschäden ab. Für eine vollständige Absicherung (Vollkasko) wird oft eine zusätzliche Versicherung angeboten, die du optional dazu buchen kannst. Wichtig: Prüfe vor der Buchung genau, welche Versicherungsleistungen im Mietpreis enthalten sind und welche zusätzlichen Kosten für erweiterte Versicherungen anfallen. Die Details findest du in den Fahrzeugbeschreibungen oder kannst du direkt beim Vermieter erfragen.",
  },
  {
    question: "Wie bereite ich meine erste Wohnmobilreise am besten vor?",
    answer: "Für deine erste Wohnmobilreise empfehlen wir folgende Vorbereitung: Informiere dich über die wichtigsten Funktionen des Fahrzeugs (Strom, Wasser, Gas, Heizung) – viele Vermieter bieten eine ausführliche Einweisung an. Plane deine Route im Voraus, aber bleibe flexibel. Buche Stellplätze für die ersten Nächte, besonders in der Hauptsaison. Packe praktisch: weniger ist mehr, da der Stauraum begrenzt ist. Denke an wichtige Utensilien wie Bettwäsche, Handtücher, Geschirr (falls nicht gestellt) und einen Erste-Hilfe-Kasten. Informiere dich über die Verkehrsregeln für Wohnmobile in den Ländern, die du bereisen möchtest. Und am wichtigsten: Nimm dir Zeit für die Eingewöhnung und genieße die Freiheit!",
  },
  {
    question: "Welche Führerscheinklasse brauche ich, um ein Wohnmobil zu mieten?",
    answer: "In Deutschland reicht für die meisten Wohnmobile und Camper der normale PKW-Führerschein (Klasse B) aus, solange das zulässige Gesamtgewicht 3,5 Tonnen nicht überschreitet und die Anzahl der Sitzplätze maximal 8 beträgt (Fahrer inklusive). Für größere Wohnmobile über 3,5 Tonnen benötigst du einen Führerschein der Klasse C1 (bis 7,5 Tonnen) oder C (unbegrenzt). Die meisten Standard-Wohnmobile liegen jedoch unter 3,5 Tonnen, sodass der normale Führerschein ausreicht. Bei der Buchung findest du in der Fahrzeugbeschreibung die genauen technischen Daten. Bei Fragen zur Führerscheinklasse kannst du auch direkt den Vermieter kontaktieren.",
  },
  {
    question: "Wie hoch ist die Kaution beim Wohnmobil mieten?",
    answer: "Die Höhe der Kaution variiert je nach Vermieter und Fahrzeugwert. In der Regel liegt sie zwischen 500 und 2.000 Euro, bei hochwertigen oder sehr großen Wohnmobilen kann sie auch höher sein. Die Kaution wird meist bei der Übergabe des Fahrzeugs hinterlegt und nach der Rückgabe und erfolgreicher Abnahme wieder zurückerstattet – in der Regel innerhalb von 7-14 Tagen, sofern keine Schäden festgestellt wurden. Einige Vermieter bieten auch die Möglichkeit, eine Selbstbeteiligung (SB) zu vereinbaren, die die Kaution reduziert. Die genaue Höhe der Kaution findest du in der Fahrzeugbeschreibung oder kannst du direkt beim Vermieter erfragen.",
  },
  {
    question: "Sind Kilometer beim Mietwohnmobil begrenzt?",
    answer: "Das hängt vom Vermieter ab. Viele Vermieter bieten eine bestimmte Anzahl an inklusiven Kilometern pro Miettag an (z.B. 200-300 km pro Tag). Überschreitest du diese Kilometerzahl, fallen zusätzliche Kosten pro Kilometer an (meist zwischen 0,20 und 0,50 Euro pro Kilometer). Einige Vermieter bieten auch unbegrenzte Kilometer an, was besonders für längere Reisen interessant ist. Die genauen Konditionen findest du in der Fahrzeugbeschreibung. Bei der Buchungsanfrage kannst du auch direkt nach den Kilometerbedingungen fragen, um Überraschungen zu vermeiden.",
  },
  {
    question: "Was muss ich bei der Rückgabe beachten?",
    answer: "Bei der Rückgabe solltest du folgende Punkte beachten: Gib das Fahrzeug sauber zurück – das bedeutet, dass du es innen und außen gereinigt haben solltest. Entleere die Abwassertanks (Grau- und Schwarzwasser) und fülle den Frischwassertank auf, falls dies vereinbart wurde. Stelle sicher, dass der Kraftstofftank wieder auf dem gleichen Füllstand ist wie bei der Übernahme (meist voll). Entferne alle persönlichen Gegenstände und prüfe, ob du alles zurückgegeben hast, was du beim Vermieter erhalten hast (z.B. Schlüssel, Dokumente, Zubehör). Vereinbare einen Rückgabetermin rechtzeitig mit dem Vermieter. Bei der gemeinsamen Abnahme werden eventuelle Schäden dokumentiert. Eine sorgfältige Rückgabe sorgt für eine schnelle Rückerstattung der Kaution.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // FAQ Schema Markup für SEO
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <section id="faq" className="border-t bg-muted/50 py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4 text-center">
              Häufig gestellte Fragen
            </h2>
            <p className="text-lg text-muted-foreground text-center mb-12">
              Alles was du über das Mieten von Wohnmobilen wissen musst
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              {faqs.map((faq, index) => (
                <Card key={index} className="overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full text-left p-6 flex items-center justify-between hover:bg-muted/50 transition-colors"
                    aria-expanded={openIndex === index}
                  >
                    <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {openIndex === index && (
                    <CardContent className="pt-0 pb-6 px-6">
                      <p className="text-muted-foreground leading-relaxed">
                        {faq.answer}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

