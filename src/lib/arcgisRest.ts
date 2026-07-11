import { esriToGeoJSON, type GeoJSONWithLimit } from '../domain/esriJson';

export function agsNormalize(url: string): string {
  return url.trim().replace(/[?#].*$/, '').replace(/\/+$/, '');
}

export async function agsFetchJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url + (url.includes('?') ? '&' : '?') + 'f=json');
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message || 'Service returned an error');
  return j;
}

export type Bbox = [number, number, number, number];

/** Queries a single ArcGIS REST layer, preferring server-native GeoJSON with a fallback to legacy Esri JSON. */
export async function agsQueryFeatures(layerUrl: string, bbox?: Bbox | null): Promise<GeoJSONWithLimit> {
  const geom = bbox
    ? '&geometry=' + bbox.join('%2C') + '&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects'
    : '';
  const q = '/query?where=1%3D1' + geom + '&outFields=*&outSR=4326&returnGeometry=true&resultRecordCount=4000&f=';
  try {
    const r = await fetch(layerUrl + q + 'geojson');
    if (r.ok) {
      const gj = await r.json();
      if (gj && gj.type === 'FeatureCollection' && !gj.error) return gj as GeoJSONWithLimit;
    }
  } catch {
    /* fall through to legacy JSON */
  }
  const r2 = await fetch(layerUrl + q + 'json');
  if (!r2.ok) throw new Error('HTTP ' + r2.status);
  const ej = await r2.json();
  if (ej.error) throw new Error(ej.error.message || 'Query failed');
  return esriToGeoJSON(ej);
}

export function agsPopupHtml(props: Record<string, unknown> | null | undefined): string {
  const keys = Object.keys(props ?? {}).slice(0, 12);
  let h = '';
  for (const k of keys) {
    const v = props?.[k];
    if (v == null || v === '') continue;
    h += `<div class="pr"><span>${escapeHtml(k)}</span><b>${escapeHtml(String(v))}</b></div>`;
  }
  return `<div class="pp-name">Feature</div>` + (h || '<div class="pr"><span>No attributes</span></div>');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}
