// Nominatim /search and /reverse endpoints
export interface NominatimPlace {
  place_id: number;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  boundingbox: [string, string, string, string];
  type?: string;
  class?: string;
  importance?: number;
}

// Domain-level representation of a location
export interface Location {
  lat: number;
  lon: number;
  // Voll mit Name, PLZ, usw.
  displayName: string;
  // Nur Stadtname zum Beispiel, anstatt Wiesbaden PLZ Deutschland nur Wiesbaden
  name?: string;
  // [minLat, maxLat, minLon, maxLon]
  boundingBox?: [number, number, number, number];
}

export interface LocationSearchParams {
  query: string;
  limit?: number;
  countryCode?: string;
}
