import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SearchParams {
  letter?: string;
}

const LETTERS = [
  "A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z","Ä","Ö","Ü",
];

export default async function LexikonPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const activeLetterRaw = (params.letter || "").toUpperCase();
  const activeLetter = LETTERS.includes(activeLetterRaw) ? activeLetterRaw : "";

  const where =
    activeLetter !== ""
      ? {
          term: {
            startsWith: activeLetter,
            mode: "insensitive" as const,
          },
        }
      : {};

  const terms = await prisma.glossaryTerm.findMany({
    where,
    orderBy: {
      term: "asc",
    },
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Lexikon</h1>
        <p className="mt-2 text-muted-foreground">
          Fachbegriffe aus der Camping- und Wohnmobilwelt erklärt
        </p>
      </div>

      <nav aria-label="Buchstabennavigation" className="mb-6 overflow-x-auto">
        <ul className="flex flex-wrap gap-2 rounded-lg border p-3">
          <li>
            <Link
              href={{ pathname: "/lexikon" }}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm",
                activeLetter === "" ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
              )}
            >
              Alle
            </Link>
          </li>
          {LETTERS.map((ltr) => (
            <li key={ltr}>
              <Link
                href={{ pathname: "/lexikon", query: { letter: ltr } }}
                className={cn(
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm",
                  activeLetter === ltr ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                )}
              >
                {ltr}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {terms.length === 0 ? (
        <div className="rounded-lg border p-12 text-center">
          <p className="text-muted-foreground">Noch keine Begriffe vorhanden</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {terms.map((term) => (
            <Link key={term.id} href={`/lexikon/${term.slug}`}>
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold">{term.term}</h2>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

