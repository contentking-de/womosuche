import { requireAdminOrEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/magazin/article-form";

export default async function NewArticlePage() {
  await requireAdminOrEditor();

  // Lade alle Editoren
  const editors = await prisma.user.findMany({
    where: { role: "EDITOR" },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
    },
    orderBy: { name: "asc" },
  });

  // Lade alle verfügbaren Kategorien aus bestehenden Artikeln
  const allArticles = await prisma.article.findMany({
    select: { categories: true },
  });
  const categorySet = new Set<string>();
  for (const article of allArticles) {
    if (article.categories) {
      for (const cat of article.categories) {
        if (cat && cat.trim()) {
          categorySet.add(cat.trim());
        }
      }
    }
  }
  const availableCategories = Array.from(categorySet).sort((a, b) =>
    a.localeCompare(b, "de", { sensitivity: "base" })
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neuer Artikel</h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie einen neuen Artikel für das Magazin
        </p>
      </div>
      <ArticleForm editors={editors} availableCategories={availableCategories} />
    </div>
  );
}

