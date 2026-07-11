import JSZip from 'jszip';
import { kml } from '@tmcw/togeojson';
import type { Geometry } from 'geojson';
import type { LatLng } from '../domain/types';

export interface ImportedLine {
  name: string;
  latlngs: LatLng[];
}

async function extractKmlText(file: File): Promise<string> {
  const name = (file.name || '').toLowerCase();
  if (name.endsWith('.kml')) return file.text();

  const zip = await JSZip.loadAsync(file);
  const entries = Object.values(zip.files).filter((f) => !f.dir && /\.kml$/i.test(f.name));
  if (!entries.length) throw new Error('No .kml found inside the KMZ.');
  const entry = entries.find((f) => /doc\.kml$/i.test(f.name)) ?? entries[0];
  return entry.async('text');
}

function collectLines(geometry: Geometry | null | undefined, name: string, out: ImportedLine[]): void {
  if (!geometry) return;
  if (geometry.type === 'LineString') {
    const latlngs = geometry.coordinates.map(([lng, lat]): LatLng => ({ lat, lng }));
    if (latlngs.length >= 2) out.push({ name, latlngs });
  } else if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates) {
      const latlngs = line.map(([lng, lat]): LatLng => ({ lat, lng }));
      if (latlngs.length >= 2) out.push({ name, latlngs });
    }
  } else if (geometry.type === 'GeometryCollection') {
    for (const g of geometry.geometries) collectLines(g, name, out);
  }
}

/** Traces of a .kml or .kmz file's LineString geometry, ready to preview/commit as network lines. */
export async function parseKmlKmzFile(file: File): Promise<ImportedLine[]> {
  const text = await extractKmlText(file);
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.getElementsByTagName('parsererror').length) throw new Error('Couldn’t parse the KML.');

  const collection = kml(doc);
  const out: ImportedLine[] = [];
  for (const f of collection.features) {
    const name = (f.properties?.name as string) || '';
    collectLines(f.geometry, name, out);
  }
  return out;
}
