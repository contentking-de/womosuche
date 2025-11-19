import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, TrendingUp } from "lucide-react";

export function AboutSection() {
  return (
    <section id="about" className="border-t bg-background py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-8 text-center">
            Über uns – alles was Du über womosuche.de wissen musst
          </h2>

          <div className="prose prose-lg max-w-none mb-12">
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              Wir sind selber campingbegeisterte Menschen, Wohnmobil-Besitzer und Camper-Fahrer. Irgendwann haben wir dann beschlossen, unsere Passion für alle Themen rund um Camping und Wohnmobile in Form einer Vermietungs-Plattform mit angeschlossenem Magazin und Lexikon auszuleben und umzusetzen. Womosuche.de macht es einfach, ein Wohnmobil oder einen Camper in der Nähe zu mieten. Mit unserer übersichtlichen und interaktiven Standort-Karte ist die Suche nach einem Fahrzeug denkbar einfach. Die entsprechenden Suchfelder wie Fahrzeugtyp, Schlafplätze und zulässiges Gesamtgewicht, lassen unsere Nutzer schnell das Wohnmobil finden, was passt.
            </p>

            <p className="text-lg text-muted-foreground leading-relaxed mb-12">
              womosuche.de ist ein Online-Marktplatz, der Wohnmobilbesitzer und -mieter zusammenbringt. Egal, ob du ein Abenteuer in einem voll ausgestatteten Wohnmobil planst oder einen kompakten Camper für einen kurzen Trip suchst, auf womosuche.de findest du eine große Auswahl an passenden Fahrzeugen für jeden. Wir haben über 100 angeschlossene Vermieter, die ihre Womos und Camper hier inserieren. Der Fahrzeugbestand auf womosuche.de liegt bei über 700 Fahrzeugen, die in ganz Deutschland anmietbar sind. Wir vermitteln über 300 Anfragen von potentiellen Mietern jeden Monat.
            </p>
          </div>

          <div className="mb-12">
            <h3 className="text-2xl font-bold mb-6 text-center">
              Die Zielgruppen unseres Angebots auf womosuche.de sind:
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Users className="mb-4 h-8 w-8 text-primary" />
                  <CardTitle>Familien</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    womosuche.de ist der perfekte Ausgangspunkt, um einen unvergesslichen Familienurlaub in einem Wohnmobil zu planen. Bei uns gibt es viele Wohnmobile mit 4 und mehr Schlafplätzen.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <MapPin className="mb-4 h-8 w-8 text-primary" />
                  <CardTitle>Abenteuerlustige</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Entdecke die Freiheit des Reisens mit einem Wohnmobil oder Campervan, die du ganz einfach über womosuche.de mieten kannst. Einfach den Fahrzeugtyp wählen und Deine Suche eingrenzen.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="mb-4 h-8 w-8 text-primary" />
                  <CardTitle>Budgetbewusste</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Kostengünstig in den Urlaub fahren, ohne auf Komfort verzichten zu müssen? Alle Fahrzeuge haben eine Preisspanne und Du kannst selber wählen, ob Dein Portemonnaie oder die Reisekasse dazu passt.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold mb-4">
              Wie funktioniert die Plattform?
            </h3>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Für Mieter ist das Angebot völlig kostenfrei und sogar zunächst unverbindlich. Du kannst Dein Wohnmobil oder den Camper hier nicht direkt buchen, sondern stellst eine kostenlose Anfrage direkt beim Vermieter. Der Vorteil: Du kannst viele Wohnmobile parallel anfragen, ohne dafür bezahlen zu müssen. Außerdem trittst Du direkt mit dem Vermieter in Kontakt und kannst auch Kondition verhandeln und besprechen. Oftmals bieten Dir die Wohnmobilvermietungen dann auch ganz andere, neuere oder größere Fahrzeuge zu den selben Konditionen an. Probiere es doch mal aus – es ist wirklich einfach.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-6">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              Mit womosuche.de wird die Planung deines nächsten Wohnmobilurlaubs zum Kinderspiel. Die Plattform bietet eine riesige Auswahl an Wohnmobilen und Campern für jeden Geschmack und Geldbeutel. Egal, ob du die deutsche Küste entlang cruisen oder die Alpen überqueren möchtest, auf womosuche.de findest du das passende Fahrzeug. Ganz einfach: Wohnmobile und Camper mieten in Deiner Nähe.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

