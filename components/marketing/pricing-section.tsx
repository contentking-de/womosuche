import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";

type Feature = string;

type Plan = {
  name: string;
  price: string;
  priceNet: number; // Nettopreis für Berechnung
  cta: string;
  href: string;
  features: Feature[];
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Starter",
    price: "€19,90",
    priceNet: 19.90,
    cta: "jetzt testen",
    href: "/register",
    features: ["1 Eintrag", "kostenlose Buchungen", "kein Support"],
  },
  {
    name: "Base",
    price: "€39,90",
    priceNet: 39.90,
    cta: "jetzt loslegen",
    href: "/register",
    features: ["bis zu 3 Fahrzeuge", "kostenlose Buchungen", "eMail-Support"],
  },
  {
    name: "Pro",
    price: "€89,90",
    priceNet: 89.90,
    cta: "jetzt loslegen",
    href: "/register",
    features: ["bis zu 10 Fahrzeuge", "kostenlose Buchungen", "Dedicated Support"],
    highlight: true,
  },
  {
    name: "Master",
    price: "€189,90",
    priceNet: 189.90,
    cta: "jetzt loslegen",
    href: "/register",
    features: ["unbegrenzte Listings", "kostenlose Buchungen", "Premium Support"],
  },
];

export function PricingSection() {
  return (
    <section className="border-t bg-muted/30 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ein Preis für jeden Fuhrpark
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Wähle das Paket, das am besten zu deinem Bedarf passt.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const isHighlight = plan.highlight === true;
            return (
              <Card
                key={plan.name}
                className={clsx(
                  "relative",
                  isHighlight && "bg-foreground text-background"
                )}
              >
                {isHighlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className={clsx("text-5xl font-extrabold leading-none sm:text-6xl")}>
                    {plan.price}
                  </div>
                  <div className={clsx("mt-1 text-xs", isHighlight ? "text-background/70" : "text-muted-foreground")}>
                    zzgl. 19% MwSt.
                  </div>
                  <div className={clsx("mt-1 text-lg font-semibold", isHighlight ? "text-background/90" : "text-foreground")}>
                    €{(plan.priceNet * 1.19).toFixed(2).replace(".", ",")} inkl. MwSt.
                  </div>
                  <CardTitle className={clsx("mt-6 text-2xl", isHighlight && "text-background")}>
                    {plan.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="my-6 h-px w-full bg-muted" />
                  <ul className="space-y-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-base">
                        <CheckCircle2
                          className={clsx(
                            "h-5 w-5",
                            isHighlight ? "text-background" : "text-primary"
                          )}
                        />
                        <span
                          className={clsx(isHighlight ? "text-background/90" : "text-foreground")}
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8">
                    <Link href={plan.href}>
                      <Button
                        size="lg"
                        className={clsx(
                          "w-full",
                          isHighlight ? "bg-white text-foreground hover:bg-white/90" : ""
                        )}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}


