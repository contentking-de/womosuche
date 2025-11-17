/* eslint-disable no-console */
import { prisma } from "../lib/prisma";

const DEFAULT_EDITOR_ID = "9ec916fb-02a2-4fc8-8eeb-956da29bd46e";

async function assignDefaultEditor() {
  try {
    // Prüfe ob der Editor existiert
    const editor = await prisma.user.findUnique({
      where: { id: DEFAULT_EDITOR_ID },
    });

    if (!editor) {
      console.error(`Fehler: User mit ID ${DEFAULT_EDITOR_ID} nicht gefunden.`);
      process.exit(1);
    }

    console.log(`Editor gefunden: ${editor.name} (${editor.email})`);

    // Finde alle Artikel ohne Editor
    const articlesWithoutEditor = await prisma.article.findMany({
      where: {
        OR: [
          { editorId: null },
          { editorId: undefined },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
    });

    console.log(`\nGefunden: ${articlesWithoutEditor.length} Artikel ohne Editor`);

    if (articlesWithoutEditor.length === 0) {
      console.log("Keine Artikel zum Aktualisieren gefunden.");
      return;
    }

    // Aktualisiere alle Artikel
    const result = await prisma.article.updateMany({
      where: {
        OR: [
          { editorId: null },
          { editorId: undefined },
        ],
      },
      data: {
        editorId: DEFAULT_EDITOR_ID,
        updatedAt: new Date(),
      },
    });

    console.log(`\nErfolgreich aktualisiert: ${result.count} Artikel`);
    console.log("\nAktualisierte Artikel:");
    articlesWithoutEditor.forEach((article) => {
      console.log(`  - ${article.title} (${article.slug})`);
    });
  } catch (error) {
    console.error("Fehler beim Zuweisen des Default-Editors:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignDefaultEditor();

