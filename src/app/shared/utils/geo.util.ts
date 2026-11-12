import { Observable } from 'rxjs';

const EARTH_RADIUS_KM = 6371;

export function getCurrentPosition(timeoutMs = 6000): Observable<GeolocationPosition> {
  return new Observable((observer) => {
    if (!navigator.geolocation) {
      observer.error(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        observer.next(pos);
        observer.complete();
      },
      (err) => observer.error(err),
      { timeout: timeoutMs, enableHighAccuracy: false },
    );
  });
}



export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
