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

