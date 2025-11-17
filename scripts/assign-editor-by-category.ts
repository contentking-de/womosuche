/* eslint-disable no-console */
import { prisma } from "../lib/prisma";

const EDITOR_ID = "cmi3h2js20000teyxa754yeia";
const CATEGORY = "Tipps&amp;Tricks für Wohnmobilisten";

async function assignEditorByCategory() {
  try {
    // Prüfe ob der Editor existiert
    const editor = await prisma.user.findUnique({
      where: { id: EDITOR_ID },
    });

    if (!editor) {
      console.error(`Fehler: User mit ID ${EDITOR_ID} nicht gefunden.`);
      process.exit(1);
    }

    console.log(`Editor gefunden: ${editor.name} (${editor.email})`);
    console.log(`Kategorie: ${CATEGORY}\n`);

    // Finde alle Artikel mit dieser Kategorie
    const articlesWithCategory = await prisma.article.findMany({
      where: {
        categories: {
          has: CATEGORY,
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        categories: true,
        editorId: true,
      },
    });

    console.log(`Gefunden: ${articlesWithCategory.length} Artikel in der Kategorie "${CATEGORY}"`);

    if (articlesWithCategory.length === 0) {
      console.log("Keine Artikel zum Aktualisieren gefunden.");
      return;
    }

    // Zeige Artikel, die bereits einen anderen Editor haben
    const articlesWithOtherEditor = articlesWithCategory.filter(
      (article) => article.editorId && article.editorId !== EDITOR_ID
    );

    if (articlesWithOtherEditor.length > 0) {
      console.log(`\nWarnung: ${articlesWithOtherEditor.length} Artikel haben bereits einen anderen Editor:`);
      articlesWithOtherEditor.forEach((article) => {
        console.log(`  - ${article.title} (Editor-ID: ${article.editorId})`);
      });
      console.log("\nDiese Artikel werden überschrieben.\n");
    }

    // Aktualisiere alle Artikel in dieser Kategorie
    const result = await prisma.article.updateMany({
      where: {
        categories: {
          has: CATEGORY,
        },
      },
      data: {
        editorId: EDITOR_ID,
        updatedAt: new Date(),
      },
    });

    console.log(`\nErfolgreich aktualisiert: ${result.count} Artikel`);
    console.log("\nAktualisierte Artikel:");
    articlesWithCategory.forEach((article) => {
      const status = article.editorId === EDITOR_ID ? "(bereits zugewiesen)" : "";
      console.log(`  - ${article.title} (${article.slug}) ${status}`);
    });
  } catch (error) {
    console.error("Fehler beim Zuweisen des Editors:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

assignEditorByCategory();

