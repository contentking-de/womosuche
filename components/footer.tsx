import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="mb-4">
              <Image
                src="/womosuche-logo.webp"
                alt="Womosuche"
                width={160}
                height={32}
                priority
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Ihre Plattform für die Vermietung von Wohnmobilen
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Navigation</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/wohnmobile" className="text-muted-foreground hover:text-foreground">
                  Wohnmobile
                </Link>
              </li>
              <li>
                <Link href="/lexikon" className="text-muted-foreground hover:text-foreground">
                  Lexikon
                </Link>
              </li>
              <li>
                <Link href="/magazin" className="text-muted-foreground hover:text-foreground">
                  Magazin
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Rechtliches</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/impressum" className="text-muted-foreground hover:text-foreground">
                  Impressum
                </Link>
              </li>
              <li>
                <Link href="/datenschutz" className="text-muted-foreground hover:text-foreground">
                  Datenschutz
                </Link>
              </li>
              <li>
                <Link href="/agb" className="text-muted-foreground hover:text-foreground">
                  AGB
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Kontakt</h4>
            <p className="text-sm text-muted-foreground">
              Für Fragen und Anregungen kontaktieren Sie uns gerne.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Wohnmobil Vermietung. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  );
}

