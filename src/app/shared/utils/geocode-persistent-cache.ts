import { Location } from '../../core/models/location.models';
import { haversineKm } from './geo.util';

const STORAGE_KEY = 'weatherangle.geocode-cache';
const MAX_PROXIMITY_KM = 0.1;
const MAX_ENTRIES = 200;

interface CacheEntry {
  lat: number;
  lon: number;
  location: Location;
  expiresAt: number;
}

export class GeocodePersistentCache {
  constructor(private readonly ttlMs: number) {}

  get(lat: number, lon: number): Location | undefined {
    const now = Date.now();
    for (const entry of this.readEntries()) {
      if (entry.expiresAt <= now) continue;
      if (haversineKm(lat, lon, entry.lat, entry.lon) <= MAX_PROXIMITY_KM) {
        return entry.location;
      }
    }
    return undefined;
  }

  set(lat: number, lon: number, location: Location): void {
    const now = Date.now();
    let entries = this.readEntries().filter((e) => e.expiresAt > now);

    const existingIndex = entries.findIndex(
      (e) => haversineKm(lat, lon, e.lat, e.lon) <= MAX_PROXIMITY_KM,
    );

    const newEntry: CacheEntry = { lat, lon, location, expiresAt: now + this.ttlMs };

    if (existingIndex >= 0) {
      entries[existingIndex] = newEntry;
    } else {
      if (entries.length >= MAX_ENTRIES) {
        entries.sort((a, b) => a.expiresAt - b.expiresAt);
        entries.shift();
      }
      entries.push(newEntry);
    }

    this.writeEntries(entries);
  }

  private readEntries(): CacheEntry[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeEntries(entries: CacheEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // localStorage unavailable or quota exceeded; silently skip persistence
    }
  }
}
