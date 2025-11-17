/**
 * Geocode eine einzelne Location zu Koordinaten
 * Verwendet Nominatim OpenStreetMap API
 */
export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`,
      {
        headers: {
          "User-Agent": "Womosuche/1.0 (https://womosuche.de)",
          "Accept-Language": "de",
        },
        signal: AbortSignal.timeout(5000), // 5 Sekunden Timeout
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
      };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding failed for ${location}:`, error);
    return null;
  }
}

