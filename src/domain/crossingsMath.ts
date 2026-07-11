import type { Geometry } from 'geojson';
import type { LatLng } from './types';

const PARCEL_NAME_KEYS = [
  'PARCELID',
  'ParcelID',
  'parcel_id',
  'PARCEL_ID',
  'PIN',
  'APN',
  'APN_TEXT',
  'NAME',
  'Name',
  'OWNER',
  'Owner',
  'SITEADDRESS',
  'SiteAddress',
  'ADDRESS',
  'Address',
];

export type Point2D = [number, number];

/** Planar segment intersection (x=lng, y=lat); returns the crossing point or null. Ported near-verbatim from the original's `cxSegPoint`. */
export function segmentIntersection(a: Point2D, b: Point2D, c: Point2D, d: Point2D): Point2D | null {
  const rx = b[0] - a[0];
  const ry = b[1] - a[1];
  const sx = d[0] - c[0];
  const sy = d[1] - c[1];
  const den = rx * sy - ry * sx;
  if (den === 0) return null;
  const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den;
  const u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
  if (t > 0 && t < 1 && u > 0 && u < 1) return [a[0] + t * rx, a[1] + t * ry];
  return null;
}

/** Extracts the line paths a geometry can be "crossed" against — points can't be crossed. */
export function geometryPaths(geometry: Geometry | null | undefined): Point2D[][] {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return [geometry.coordinates as Point2D[]];
  if (geometry.type === 'MultiLineString') return geometry.coordinates as Point2D[][];
  if (geometry.type === 'Polygon') return geometry.coordinates as Point2D[][];
  if (geometry.type === 'MultiPolygon') {
    const out: Point2D[][] = [];
    for (const poly of geometry.coordinates as Point2D[][][]) for (const ring of poly) out.push(ring);
    return out;
  }
  return [];
}

export interface CrossingResult {
  count: number;
  points: Point2D[];
}

/** Counts crossings between one of the user's lines and every feature in an ArcGIS GeoJSON layer. */
export function countLineCrossings(lineLatLngs: LatLng[], geojson: { features: { geometry: Geometry | null }[] }): CrossingResult {
  const a: Point2D[] = lineLatLngs.map((ll) => [ll.lng, ll.lat]);
  let count = 0;
  const points: Point2D[] = [];
  for (const f of geojson.features) {
    for (const path of geometryPaths(f.geometry)) {
      for (let i = 1; i < a.length; i++) {
        for (let j = 1; j < path.length; j++) {
          const p = segmentIntersection(a[i - 1], a[i], path[j - 1], path[j]);
          if (p) {
            count++;
            points.push(p);
          }
        }
      }
    }
  }
  return { count, points };
}

/** Whether an ArcGIS layer's GeoJSON contains (Multi)Polygon geometry — polygons are counted per-feature, not per-edge. */
export function isPolygonLayer(geojson: { features: { geometry: Geometry | null }[] }): boolean {
  return geojson.features.some((f) => f.geometry && (f.geometry.type === 'Polygon' || f.geometry.type === 'MultiPolygon'));
}

function pointInRing(pt: Point2D, ring: Point2D[]): boolean {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

/** A point is inside a polygon's rings if it's in the outer ring and not in any hole. */
function pointInRings(pt: Point2D, rings: Point2D[][]): boolean {
  if (!pointInRing(pt, rings[0])) return false;
  for (let k = 1; k < rings.length; k++) {
    if (pointInRing(pt, rings[k])) return false;
  }
  return true;
}

function pointInGeometry(pt: Point2D, geometry: Geometry | null | undefined): boolean {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return pointInRings(pt, geometry.coordinates as Point2D[][]);
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as Point2D[][][]).some((poly) => pointInRings(pt, poly));
  return false;
}

export interface PolygonHitResult {
  hit: Set<number>;
  points: Point2D[];
}

/** A polygon "hits" a line if the line crosses its boundary OR one of the line's vertices falls inside it — each polygon counted once. */
export function linePolygonHits(lineLatLngs: LatLng[], geojson: { features: { geometry: Geometry | null }[] }): PolygonHitResult {
  const a: Point2D[] = lineLatLngs.map((ll) => [ll.lng, ll.lat]);
  const hit = new Set<number>();
  const points: Point2D[] = [];
  geojson.features.forEach((f, fi) => {
    if (!f.geometry) return;
    let hitThis = false;
    for (const path of geometryPaths(f.geometry)) {
      for (let i = 1; i < a.length; i++) {
        for (let j = 1; j < path.length; j++) {
          const p = segmentIntersection(a[i - 1], a[i], path[j - 1], path[j]);
          if (p) {
            hitThis = true;
            points.push(p);
          }
        }
      }
    }
    if (!hitThis && a.some((pt) => pointInGeometry(pt, f.geometry))) hitThis = true;
    if (hitThis) hit.add(fi);
  });
  return { hit, points };
}

/** Outer rings only, one per polygon — used to materialize hit polygons as new features. */
export function polygonRings(geometry: Geometry | null | undefined): Point2D[][] {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return [(geometry.coordinates as Point2D[][])[0]];
  if (geometry.type === 'MultiPolygon') return (geometry.coordinates as Point2D[][][]).map((p) => p[0]);
  return [];
}

/** Best-effort name for a parcel feature, checking common ID/owner/address field names. */
export function parcelNameFromProps(props: Record<string, unknown> | null | undefined): string {
  const p = props ?? {};
  for (const key of PARCEL_NAME_KEYS) {
    const v = p[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return '';
}
