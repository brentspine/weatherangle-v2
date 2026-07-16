export interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags?: {
    place?: string;
    name?: string;
    population?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  elements: OverpassNode[];
}

// Reihenfolge: minLat, maxLat, minLon, maxLon
export type BoundingBox = [number, number, number, number];

export interface NearbySettlement {
  id: number;
  lat: number;
  lon: number;
  name: string;
  place: string;
  population?: number;
}
