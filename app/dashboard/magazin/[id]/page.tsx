import { requireAdminOrEditor } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/magazin/article-form";

export default async function EditArticlePage(props: any) {
  const params =
    props?.params && typeof props.params?.then === "function"
      ? await props.params
      : props?.params;
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  await requireAdminOrEditor();

  const [article, editors, allArticles] = await Promise.all([
    prisma.article.findUnique({
      where: { id },
    }),
    prisma.user.findMany({
      where: { role: "EDITOR" },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.article.findMany({
      select: { categories: true },
    }),
  ]);

  if (!article) {
    notFound();
  }

  // Lade alle verfügbaren Kategorien aus bestehenden Artikeln
  const categorySet = new Set<string>();
  for (const art of allArticles) {
    if (art.categories) {
      for (const cat of art.categories) {
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
        <h1 className="text-3xl font-bold">Artikel bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Bearbeiten Sie den Artikel
        </p>
      </div>
      <ArticleForm article={article} editors={editors} availableCategories={availableCategories} />
    </div>
  );
}

