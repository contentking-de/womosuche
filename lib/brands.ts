// Liste aller verfügbaren Marken
export const availableBrands = [
  "Hymer",
  "Sunlight",
  "Carado",
  "Forster",
  "Carthago",
  "Weinsberg",
  "Malibu",
  "Knaus",
  "Bürstner",
  "Volkswagen",
  "Pössl",
  "Dethleffs",
  "Mobilvetta",
  "Mercedes",
  "Crosscamp",
  "Benimar",
  "Ahorn",
  "Pilote",
  "Etrusco",
  "Chausson",
  "Moveo",
  "Sun Living",
  "Adria",
  "Niessman+Bischoff",
  "Robeta",
  "La Marca",
  "Roadcar",
  "Karmann",
  "Eura Mobil",
];

/**
 * Prüft, ob ein String eine gültige Marke ist (case-insensitive)
 */
export function isValidBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  return availableBrands.some(b => b.toLowerCase() === brand.toLowerCase());
}

/**
 * Findet die korrekte Marke aus einem String (case-insensitive)
 */
export function findBrand(brandParam: string): string | null {
  if (!brandParam) return null;
  const normalized = brandParam.toLowerCase();
  return availableBrands.find(b => b.toLowerCase() === normalized) || null;
}

/**
 * Konvertiert einen URL-String zu einer Marke (URL-Encoding und case-insensitive)
 */
export function normalizeBrandFromUrl(brandParam: string): string | null {
  try {
    // Decodiere URL-Encoding
    const decoded = decodeURIComponent(brandParam);
    // Finde die korrekte Marke (case-insensitive)
    return findBrand(decoded);
  } catch {
    return null;
  }
}

/**
 * Konvertiert einen Markennamen zu einer URL-kompatiblen Version (immer kleingeschrieben)
 */
export function brandToUrl(brand: string): string {
  return encodeURIComponent(brand.toLowerCase());
}

