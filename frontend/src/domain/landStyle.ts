import type { LatLng, PolyType } from './types';

export interface PolyStyleDef {
  color: string;
  weight: number;
  opacity: number;
  fill: boolean;
  fillColor: string;
  fillOpacity: number;
  dashArray: string | null;
}

/** Ported verbatim from main's `LAND_STYLE`. */
export const LAND_STYLE: Record<PolyType, PolyStyleDef> = {
  site: { color: '#2f7d4f', weight: 3, opacity: 0.95, fill: true, fillColor: '#2f7d4f', fillOpacity: 0.05, dashArray: '8 5' },
  lease: { color: '#2f7d4f', weight: 2, opacity: 0.9, fill: true, fillColor: '#4aa06f', fillOpacity: 0.16, dashArray: null },
  building: { color: '#8a5a2b', weight: 1.5, opacity: 0.95, fill: true, fillColor: '#c08341', fillOpacity: 0.55, dashArray: null },
  parcel: { color: '#4f6d7a', weight: 2, opacity: 0.9, fill: true, fillColor: '#4f6d7a', fillOpacity: 0.15, dashArray: null },
};

const EARTH_RADIUS_M = 6378137;
const DEG_TO_RAD = Math.PI / 180;

/** Approximate geodesic polygon area in m² (spherical excess / shoelace on lat-lng), matching main's `polyArea`. */
export function polyArea(latlngs: LatLng[]): number {
  if (!latlngs || latlngs.length < 3) return 0;
  let a = 0;
  const n = latlngs.length;
  for (let i = 0; i < n; i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[(i + 1) % n];
    a += (p2.lng - p1.lng) * DEG_TO_RAD * (2 + Math.sin(p1.lat * DEG_TO_RAD) + Math.sin(p2.lat * DEG_TO_RAD));
  }
  return Math.abs((a * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

const SQ_METERS_PER_ACRE = 4046.8564224;

/** Matches main's `fmtArea` — acres above ~0.1ac, otherwise ft², both with the raw m² alongside. */
export function fmtArea(m2: number): string {
  if (!m2) return '0';
  const ac = m2 / SQ_METERS_PER_ACRE;
  if (ac >= 0.1) return `${ac.toFixed(2)} ac (${Math.round(m2).toLocaleString()} m²)`;
  return `${Math.round(m2 * 10.7639).toLocaleString()} ft² (${Math.round(m2).toLocaleString()} m²)`;
}
