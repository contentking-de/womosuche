/* eslint-disable no-console */
import { prisma } from "../lib/prisma";

async function listCategories() {
  try {
    const articles = await prisma.article.findMany({
      select: { categories: true },
    });

    const allCategories = new Set<string>();
    articles.forEach((article) => {
      if (article.categories) {
        article.categories.forEach((cat) => allCategories.add(cat));
      }
    });

    console.log("Alle Kategorien in der Datenbank:\n");
    Array.from(allCategories)
      .sort()
      .forEach((cat) => console.log(`  - "${cat}"`));
  } catch (error) {
    console.error("Fehler:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

listCategories();

