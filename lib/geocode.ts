/**
 * Geocode eine einzelne Location zu Koordinaten
 * Verwendet Nominatim OpenStreetMap API
 */
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!location || location.trim() === "") {
      console.warn("Geocoding: Leerer Standort");
      return null;
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
    
    // Erstelle einen AbortController für Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Womosuche/1.0 (https://womosuche.de)",
          "Accept-Language": "de",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`Geocoding HTTP error für ${location}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      if (data && Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        if (isNaN(lat) || isNaN(lng)) {
          console.error(`Geocoding: Ungültige Koordinaten für ${location}`);
          return null;
        }
        
        return { lat, lng };
      }

      console.warn(`Geocoding: Keine Ergebnisse für ${location}`);
      return null;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error(`Geocoding timeout für ${location}`);
      } else {
        console.error(`Geocoding fetch error für ${location}:`, fetchError);
      }
      return null;
    }
  } catch (error) {
    console.error(`Geocoding failed for ${location}:`, error);
    return null;
  }
}

