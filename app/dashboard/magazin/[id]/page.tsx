import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArticleForm } from "@/components/magazin/article-form";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();

  const article = await prisma.article.findUnique({
    where: { id: params.id },
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

