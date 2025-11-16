import { requireAdmin } from "@/lib/auth-helpers";
import { ArticleForm } from "@/components/magazin/article-form";

export default async function NewArticlePage() {
  await requireAdmin();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neuer Artikel</h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie einen neuen Artikel für das Magazin
        </p>
      </div>
      <ArticleForm />
    </div>
  );
}

