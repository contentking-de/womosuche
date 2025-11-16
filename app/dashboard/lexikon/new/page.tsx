import { requireAdmin } from "@/lib/auth-helpers";
import { GlossaryTermForm } from "@/components/lexikon/glossary-term-form";

export default async function NewGlossaryTermPage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neuer Begriff</h1>
        <p className="mt-2 text-muted-foreground">
          Fügen Sie einen neuen Fachbegriff zum Lexikon hinzu
        </p>
      </div>
      <GlossaryTermForm />
    </div>
  );
}

