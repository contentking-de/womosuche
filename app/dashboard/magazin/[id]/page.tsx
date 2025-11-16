import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/magazin/article-form";

export default async function EditArticlePage({ params }: any) {
  const idParam = params?.id;
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  await requireAdmin();

  const article = await prisma.article.findUnique({
    where: { id },
  });

  if (!article) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Artikel bearbeiten</h1>
        <p className="mt-2 text-muted-foreground">
          Bearbeiten Sie den Artikel
        </p>
      </div>
      <ArticleForm article={article} />
    </div>
  );
}

