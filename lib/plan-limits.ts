/**
 * Mapping von Plan-Namen und Preisen zu Fahrzeug-Limits
 * Diese Daten müssen mit den Stripe-Produkten übereinstimmen
 */
export interface PlanLimit {
  maxVehicles: number | null; // null = unbegrenzt
  displayText: string;
}

/**
 * Ermittelt das Fahrzeug-Limit basierend auf Plan-Namen oder Preis
 */
export function getPlanLimit(planName: string | null, price: number | null): PlanLimit {
  if (!planName && !price) {
    return { maxVehicles: null, displayText: "Unbekannt" };
  }

  const name = planName?.toLowerCase() || "";
  const priceValue = price || 0;

  // Prüfe zuerst nach Plan-Namen
  if (name.includes("starter")) {
    return { maxVehicles: 1, displayText: "1 Fahrzeug" };
  }
  
  if (name.includes("base")) {
    return { maxVehicles: 3, displayText: "bis zu 3 Fahrzeuge" };
  }
  
  if (name.includes("pro")) {
    return { maxVehicles: 10, displayText: "bis zu 10 Fahrzeuge" };
  }
  
  if (name.includes("master")) {
    return { maxVehicles: null, displayText: "unbegrenzte Fahrzeuge" };
  }

  // Fallback: Prüfe nach Preis (in Euro)
  // Starter: ~19.90€
  if (priceValue >= 19 && priceValue < 30) {
    return { maxVehicles: 1, displayText: "1 Fahrzeug" };
  }
  
  // Base: ~39.90€
  if (priceValue >= 30 && priceValue < 60) {
    return { maxVehicles: 3, displayText: "bis zu 3 Fahrzeuge" };
  }
  
  // Pro: ~89.90€
  if (priceValue >= 60 && priceValue < 150) {
    return { maxVehicles: 10, displayText: "bis zu 10 Fahrzeuge" };
  }
  
  // Master: ~189.90€
  if (priceValue >= 150) {
    return { maxVehicles: null, displayText: "unbegrenzte Fahrzeuge" };
  }

  return { maxVehicles: null, displayText: "Unbekannt" };
}

