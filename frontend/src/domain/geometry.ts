export interface Point2D {
  x: number;
  y: number;
}

export function distance2D(a: Point2D, b: Point2D): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Returns the value whose point is closest to `target` within `maxDist`, or null if none qualify. */
export function nearestWithin<T>(
  target: Point2D,
  candidates: { point: Point2D; value: T }[],
  maxDist: number,
): T | null {
  let best: T | null = null;
  let bestDist = maxDist;
  for (const c of candidates) {
    const d = distance2D(target, c.point);
    if (d < bestDist) {
      bestDist = d;
      best = c.value;
    }
  }
  return best;
}

export function coincident(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  return Math.abs(a.lat - b.lat) < 1e-7 && Math.abs(a.lng - b.lng) < 1e-7;
}

/** Great-circle distance in meters — matches Leaflet's L.CRS.Earth.distance exactly (same R, same formula). */
const EARTH_RADIUS_M = 6371000;
export function haversineDistance(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const lat1 = a.lat * rad;
  const lat2 = b.lat * rad;
  const sinDLat = Math.sin(((b.lat - a.lat) * rad) / 2);
  const sinDLon = Math.sin(((b.lng - a.lng) * rad) / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_M * c;
}

export function lineLengthMeters(latlngs: { lat: number; lng: number }[]): number {
  let m = 0;
  for (let i = 1; i < latlngs.length; i++) m += haversineDistance(latlngs[i - 1], latlngs[i]);
  return m;
}

export function formatLength(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
}
