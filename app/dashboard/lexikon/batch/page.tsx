import { requireAdmin } from "@/lib/auth-helpers";
import { BatchGlossaryForm } from "@/components/lexikon/batch-glossary-form";

export default async function BatchLexikonPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Batch-Erstellung</h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie mehrere Lexikon-Begriffe auf einmal mit KI-Generierung
        </p>
      </div>
      <BatchGlossaryForm />
    </div>
  );
}

