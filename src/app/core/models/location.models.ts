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
  // Nur vorhanden wenn namedetails=1 angefragt wird; enthält u.a. den lokalen Namen
  // unabhängig von der (per Accept-Language übersetzten) display_name
  namedetails?: Record<string, string>;
  // Nominatim returns HTTP 200 with this field instead of an error status when geocoding fails
  error?: string | { code: number; message: string };
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
