import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default async function LexikonPage() {
  const terms = await prisma.glossaryTerm.findMany({
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

