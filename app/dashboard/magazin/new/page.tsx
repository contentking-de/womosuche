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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Neuer Artikel</h1>
        <p className="mt-2 text-muted-foreground">
          Erstellen Sie einen neuen Artikel für das Magazin
        </p>
      </div>
      <ArticleForm editors={editors} />
    </div>
  );
}

