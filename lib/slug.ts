export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s*&amp;\s*/g, "") // Entferne &amp; und umgebende Leerzeichen
    .replace(/\s*&\s*/g, "") // Entferne & und umgebende Leerzeichen
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Entferne diakritische Zeichen
    .replace(/[^a-z0-9]+/g, "-") // Ersetze alles außer Buchstaben und Zahlen mit -
    .replace(/^-+|-+$/g, ""); // Entferne führende und abschließende -
}

export async function generateUniqueSlug(
  baseText: string,
  checkUnique: (slug: string) => Promise<boolean>,
  maxAttempts = 10
): Promise<string> {
  let slug = generateSlug(baseText);
  let attempts = 0;

  while (attempts < maxAttempts) {
    const isUnique = await checkUnique(slug);
    if (isUnique) {
      return slug;
    }
    attempts++;
    slug = `${generateSlug(baseText)}-${attempts}`;
  }

  // Fallback: füge Timestamp hinzu
  return `${generateSlug(baseText)}-${Date.now()}`;
}

// Prüft, ob eine Kategorie ausgeblendet werden soll
function shouldHideCategory(category: string): boolean {
  const trimmed = category.trim();
  // Prüfe auf Postleitzahl-Kategorien
  const isPostalCode = /^Postleitzahl\s+\d{5}-\d{5}$/i.test(trimmed) || 
                       /^Postleitzahl/i.test(trimmed);
  // Prüfe auf "Wohnmobil Abstellplätze"
  const isAbstellplaetze = /^Wohnmobil\s+Abstellplätze/i.test(trimmed);
  
  return isPostalCode || isAbstellplaetze;
}

// Gibt die erste Kategorie eines Artikels als Slug zurück
export function getFirstCategorySlug(categories: string[] | null): string | null {
  if (!categories || categories.length === 0) {
    return null;
  }
  
  // Filtere ausgeblendete Kategorien heraus
  const validCategories = categories.filter(
    (cat: string) => !shouldHideCategory(cat)
  );
  
  if (validCategories.length === 0) {
    return null;
  }
  
  // Nimm die erste gültige Kategorie
  return generateSlug(validCategories[0]);
}

// Erstellt die vollständige Artikel-URL mit Kategorie
export function getArticleUrl(slug: string, categories: string[] | null): string {
  const categorySlug = getFirstCategorySlug(categories);
  if (categorySlug) {
    return `/magazin/${categorySlug}/${slug}`;
  }
  // Fallback: wenn keine Kategorie vorhanden ist, verwende die alte URL-Struktur
  return `/magazin/${slug}`;
}

