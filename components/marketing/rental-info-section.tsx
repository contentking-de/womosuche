import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";

export function RentalInfoSection() {
  return (
    <section className="bg-muted/50 pt-24 pb-2">
      <div className="container mx-auto px-4">
        {/* Hauptüberschrift */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Wohnmobile mieten in ganz Deutschland – schnell, sicher & komfortabel
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Du möchtest Wohnmobile mieten, einen Camper mieten oder ein Reisemobil mieten – und das möglichst einfach? Auf unserer Plattform findest du eine große Auswahl an Fahrzeugen von professionellen Vermietern aus ganz Deutschland. Vergleiche Modelle, Preise und Ausstattung und stelle deine Buchungsanfrage direkt online.
          </p>
        </div>

        {/* Zwei Spalten für Mieter und Vermieter */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Für Mieter */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Für Mieter: Dein Weg zum perfekten Wohnmobil
                </h3>
                <p className="text-muted-foreground mb-6">
                  Ob spontaner Wochenendtrip oder große Rundreise – bei uns findest du genau das Fahrzeug, das zu deinen Plänen passt.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>riesige Auswahl an Wohnmobilen, Campern und Reisemobilen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>transparente Infos & klare Preise</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>einfache Buchungsanfragen direkt an den Vermieter</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>sichere Vermittlung & schnelle Rückmeldungen</span>
                  </li>
                </ul>
                <p className="mt-6 font-bold text-green-600 mb-6">
                  Mit uns wird Wohnmobile mieten so unkompliziert wie nie zuvor. Finde Dein Fahrzeug in unserem deutschlandweiten Angebot an Wohnmobilen, Campern und Reisemobilen.
                </p>
                <Link href="/wohnmobile" className="block">
                  <Button size="lg" className="w-full px-8 py-6 text-lg font-bold">
                    Jetzt Wohnmobil finden
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Für Vermieter */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">
                  Für Vermieter: Mehr Sichtbarkeit & qualifizierte Anfragen
                </h3>
                <p className="text-muted-foreground mb-6">
                  Vermieter erhalten alle Buchungsanfragen zentral in unserem übersichtlichen Dashboard – inklusive Benachrichtigung per E-Mail.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>mehr Reichweite für deine Wohnmobile</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>zentrale Verwaltung aller Anfragen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>zeitsparende Kommunikation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>keine technische Einrichtung notwendig</span>
                  </li>
                </ul>
                <p className="mt-6 font-bold text-green-600 mb-6">
                  Unsere Plattform bringt dich direkt mit Menschen zusammen, die aktiv nach Wohnmobilen zur Miete suchen.
                </p>
                <Link href="/register" className="block">
                  <Button size="lg" className="w-full px-8 py-6 text-lg font-bold bg-secondary hover:bg-secondary/90 text-secondary-foreground">
                    Jetzt vermieten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
      </div>
    </section>
  );
}

