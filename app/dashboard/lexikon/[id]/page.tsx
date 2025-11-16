import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { GlossaryTermForm } from "@/components/lexikon/glossary-term-form";

export default async function EditGlossaryTermPage({ params }: any) {
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  await requireAdmin();

  const term = await prisma.glossaryTerm.findUnique({
    where: { id },
  });

  if (!term) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Begriff bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Bearbeiten Sie den Fachbegriff
        </p>
      </div>
      <GlossaryTermForm term={term} />
    </div>
  );
}

