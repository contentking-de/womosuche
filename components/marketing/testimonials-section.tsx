"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { FeedbackForm } from "./feedback-form";

interface Testimonial {
  name: string;
  location: string;
  rating: number;
  text: string;
  role: "Mieter" | "Vermieter";
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah M.",
    location: "München",
    rating: 5,
    text: "Super einfache Plattform! Ich habe innerhalb von wenigen Minuten das perfekte Wohnmobil für unseren Familienurlaub gefunden. Die Kommunikation mit dem Vermieter war unkompliziert und das Fahrzeug war genau wie beschrieben.",
    role: "Mieter",
  },
  {
    name: "Thomas K.",
    location: "Hamburg",
    rating: 5,
    text: "Als Vermieter schätze ich besonders das übersichtliche Dashboard. Alle Anfragen kommen zentral an und ich kann schnell reagieren. Die Qualität der Anfragen ist sehr gut!",
    role: "Vermieter",
  },
  {
    name: "Lisa R.",
    location: "Berlin",
    rating: 5,
    text: "Endlich eine Plattform, die wirklich funktioniert! Die Suche nach Filtern ist genial und ich habe genau das gefunden, was ich gesucht habe. Sehr empfehlenswert!",
    role: "Mieter",
  },
  {
    name: "Michael B.",
    location: "Köln",
    rating: 5,
    text: "Top Service! Die Buchungsanfrage wurde innerhalb von Stunden beantwortet. Das Wohnmobil war in perfektem Zustand und die Übergabe verlief reibungslos. Gerne wieder!",
    role: "Mieter",
  },
  {
    name: "Anna S.",
    location: "Stuttgart",
    rating: 5,
    text: "Seit ich meine Wohnmobile hier anbiete, habe ich deutlich mehr Anfragen. Die Verwaltung ist super einfach und die Mieterschaft ist sehr zuverlässig. Absolute Empfehlung!",
    role: "Vermieter",
  },
  {
    name: "David L.",
    location: "Frankfurt",
    rating: 5,
    text: "Perfekt für spontane Trips! Die Auswahl ist riesig und die Preise sind fair. Besonders gut gefällt mir die detaillierte Beschreibung jedes Fahrzeugs mit vielen Bildern.",
    role: "Mieter",
  },
  {
    name: "Julia W.",
    location: "Dresden",
    rating: 5,
    text: "Die Plattform ist sehr benutzerfreundlich. Als Vermieterin kann ich alle wichtigen Informationen schnell eintragen und verwalten. Die Kommunikation mit Mietern funktioniert einwandfrei.",
    role: "Vermieter",
  },
  {
    name: "Markus F.",
    location: "Nürnberg",
    rating: 5,
    text: "Wirklich beeindruckend! Von der Suche bis zur Rückgabe war alles perfekt organisiert. Das Wohnmobil hatte alles, was wir brauchten, und mehr. Vielen Dank für diese tolle Erfahrung!",
    role: "Mieter",
  },
  {
    name: "Petra H.",
    location: "Düsseldorf",
    rating: 5,
    text: "Als Vermieterin bin ich begeistert von der Qualität der Anfragen. Alle Mietinteressenten waren seriös und gut informiert. Die Plattform spart mir viel Zeit bei der Verwaltung.",
    role: "Vermieter",
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  // Responsive: 1 auf Mobile, 3 auf Desktop
  const [itemsPerPage, setItemsPerPage] = useState(3);
  
  // Update itemsPerPage based on screen size
  useEffect(() => {
    const updateItemsPerPage = () => {
      const newItemsPerPage = window.innerWidth >= 768 ? 3 : 1;
      setItemsPerPage(newItemsPerPage);
      // Reset index if needed
      const newMaxIndex = Math.max(0, testimonials.length - newItemsPerPage);
      if (currentIndex > newMaxIndex) {
        setCurrentIndex(newMaxIndex);
      }
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, [currentIndex]);
  
  const maxIndex = Math.max(0, testimonials.length - itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  return (
    <section id="testimonials" className="border-t bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Was unsere Nutzer sagen
          </h2>
          <p className="text-lg text-muted-foreground">
            Echte Erfahrungen von Mietern und Vermietern
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto">
          {/* Slider Container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
              }}
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="min-w-0 flex-shrink-0 px-4"
                  style={{ width: `${100 / itemsPerPage}%` }}
                >
                  <Card className="flex flex-col h-full">
                    <CardContent className="p-6 flex flex-col flex-grow">
                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star
                            key={i}
                            className="h-5 w-5 fill-yellow-400 text-yellow-400"
                          />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 flex-grow">
                        "{testimonial.text}"
                      </p>
                      <div className="mt-auto">
                        <p className="font-semibold">{testimonial.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {testimonial.location} • {testimonial.role}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              className="rounded-full"
              aria-label="Vorherige Testimonials"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {/* Dots Indicator */}
            <div className="flex gap-2">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-muted-foreground/30"
                  }`}
                  aria-label={`Gehe zu Seite ${index + 1}`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              className="rounded-full"
              aria-label="Nächste Testimonials"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Feedback Button */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
          <p className="text-muted-foreground">
            Du hast über uns gemietet oder bist Wohnmobilvermieter? Dann freuen wir uns über Dein Feedback und Deine Bewertung.
          </p>
          <FeedbackForm />
        </div>
      </div>
    </section>
  );
}

