import type { Feature, FeatureCollection, Geometry } from 'geojson';

interface EsriGeometry {
  x?: number;
  y?: number;
  paths?: number[][][];
  rings?: number[][][];
}
interface EsriFeature {
  attributes?: Record<string, unknown>;
  geometry?: EsriGeometry;
}
export interface EsriFeatureSet {
  features?: EsriFeature[];
  exceededTransferLimit?: boolean;
}

export interface GeoJSONWithLimit extends FeatureCollection {
  exceededTransferLimit: boolean;
}

/** Converts legacy Esri JSON (f=json) query results into GeoJSON, for ArcGIS servers too old to serve f=geojson directly. */
export function esriToGeoJSON(ej: EsriFeatureSet): GeoJSONWithLimit {
  const features: Feature[] = [];
  for (const f of ej.features ?? []) {
    const g = f.geometry;
    let geometry: Geometry | null = null;
    if (g) {
      if (g.x != null && isFinite(g.x)) {
        geometry = { type: 'Point', coordinates: [g.x, g.y as number] };
      } else if (g.paths) {
        geometry = g.paths.length > 1 ? { type: 'MultiLineString', coordinates: g.paths } : { type: 'LineString', coordinates: g.paths[0] };
      } else if (g.rings) {
        geometry = { type: 'Polygon', coordinates: g.rings };
      }
    }
    if (geometry) features.push({ type: 'Feature', properties: f.attributes ?? {}, geometry });
  }
  return { type: 'FeatureCollection', features, exceededTransferLimit: !!ej.exceededTransferLimit };
}
