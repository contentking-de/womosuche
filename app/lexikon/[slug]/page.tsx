import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) return {};
  const term = await prisma.glossaryTerm.findFirst({
    where: { slug },
  });

  if (!term) {
    return {};
  }

  return {
    title: `${term.term} - Lexikon`,
    description: term.content.substring(0, 160),
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) {
    notFound();
  }
  const term = await prisma.glossaryTerm.findFirst({
    where: { slug },
  });

  if (!term) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/lexikon">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zum Lexikon
        </Button>
      </Link>

      <Card>
        <CardContent className="p-8">
          <h1 className="mb-6 text-4xl font-bold">{term.term}</h1>
          <div
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{
              __html: term.content.replace(/\n/g, "<br />"),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

