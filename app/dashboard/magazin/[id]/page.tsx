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

  const [article, editors] = await Promise.all([
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
  ]);

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
      <ArticleForm article={article} editors={editors} />
    </div>
  );
}

