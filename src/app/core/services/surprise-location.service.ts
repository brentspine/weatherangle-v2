import { Injectable } from '@angular/core';

interface BoundingBox {
  start: [number, number];
  end: [number, number];
}

interface Place {
  lat: number;
  lon: number;
}

interface SuggestionsCache {
  places: Place[];
  expiresAt: number;
}

const STORAGE_KEY = 'weatherangle.suggestions-cache';
const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable({
  providedIn: 'root',
})
export class SurpriseLocationService {
  private readonly ranges: BoundingBox[] = [
    { start: [45.706179, -0.791016], end: [53.330873, 24.433594] }, // Europa
    { start: [46.55886, -121.816406], end: [31.353637, -83.232422] }, // USA
    { start: [-4.541943, -70.756084], end: [-22.967151, -42.055922] }, // Südamerika
    { start: [22.512557, 114.257813], end: [40.913513, 74.179688] }, // Asien
    { start: [51.082822, -2.460938], end: [53.455349, -0.219727] }, // GB
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
    { start: [47.517201, 7.668457], end: [53.683695, 13.227539] }, // Deutschland
  ];

  private cachedSuggestions: Place[] | null = null;

  getRandomLocation(): Place {
    const box = this.ranges[Math.floor(Math.random() * this.ranges.length)];
    const lat = box.start[0] + Math.random() * (box.end[0] - box.start[0]);
    const lon = box.start[1] + Math.random() * (box.end[1] - box.start[1]);
    return { lat, lon };
  }

  getSuggestions(count = 3): Place[] {
    if (this.cachedSuggestions) return this.cachedSuggestions;

    const persisted = this.readCache();
    if (persisted) {
      this.cachedSuggestions = persisted;
      return persisted;
    }

    const suggestions = Array.from({ length: count }, () => this.getRandomLocation());
    this.cachedSuggestions = suggestions;
    this.writeCache(suggestions);
    return suggestions;
  }

  refreshSuggestions(count = 3): Place[] {
    this.cachedSuggestions = null;
    this.clearCache();
    return this.getSuggestions(count);
  }

  private readCache(): Place[] | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed: SuggestionsCache = JSON.parse(raw);
      if (parsed.expiresAt <= Date.now()) return null;
      return parsed.places;
    } catch {
      return null;
    }
  }

  private writeCache(places: Place[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ places, expiresAt: Date.now() + CACHE_TTL_MS }));
    } catch {
      // localStorage unavailable or quota exceeded
    }
  }

  private clearCache(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable
    }
  }
}
