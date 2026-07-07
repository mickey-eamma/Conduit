import type { Geometry } from 'geojson';
import type { LatLng } from './types';

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
