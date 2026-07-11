import type { LatLng } from '../domain/types';
import type { ImportedLine } from './kmlKmzImport';

/**
 * DWG import via LibreDWG (WASM), lazy-loaded from CDN — kept as a runtime
 * dynamic import (not a package.json dependency) exactly as the original,
 * since it's a heavy WASM module only needed if the user actually imports a
 * .dwg file. Coordinates are taken as-is (X=lng, Y=lat); no CRS reprojection,
 * matching the original's assumption that the source file is already in
 * lat/lng.
 */

interface DwgVector {
  x: number;
  y: number;
}
interface DwgEntity {
  type: string;
  layer?: string;
  startPoint?: DwgVector;
  endPoint?: DwgVector;
  vertices?: DwgVector[];
  flag?: number;
}
interface DwgDb {
  entities?: DwgEntity[];
}
interface LibreDwgInstance {
  dwg_read_data(buf: ArrayBuffer, fileType: number): unknown;
  convert(dwg: unknown): DwgDb;
  dwg_free(dwg: unknown): void;
}

let libredwg: LibreDwgInstance | null = null;

const LIBREDWG_CDN_URL = 'https://esm.run/@mlightcad/libredwg-web@0.7.7';

async function getLibreDwg(): Promise<LibreDwgInstance> {
  if (!libredwg) {
    // Non-literal specifier so TS treats this as `any` instead of trying
    // (and failing) to resolve a real CDN URL as a module at typecheck time.
    const mod = await import(/* @vite-ignore */ LIBREDWG_CDN_URL);
    libredwg = await mod.LibreDwg.create();
  }
  return libredwg!;
}

function dwgEntityLatLngs(e: DwgEntity): LatLng[] | null {
  let pts: [number, number][] | null = null;
  if (e.type === 'LINE' && e.startPoint && e.endPoint) {
    pts = [
      [e.startPoint.x, e.startPoint.y],
      [e.endPoint.x, e.endPoint.y],
    ];
  } else if ((e.type === 'LWPOLYLINE' || e.type === 'POLYLINE2D' || e.type === 'POLYLINE3D') && Array.isArray(e.vertices)) {
    pts = e.vertices.map((v): [number, number] => [v.x, v.y]);
    if ((e.flag ?? 0) & 1 && pts.length >= 2) pts.push([pts[0][0], pts[0][1]]); // closed polyline -> close the ring
  }
  if (!pts) return null;
  const ll = pts.filter((p) => isFinite(p[0]) && isFinite(p[1])).map((p): LatLng => ({ lat: p[1], lng: p[0] })); // x=lng, y=lat
  return ll.length >= 2 ? ll : null;
}

export async function parseDwgFile(file: File): Promise<ImportedLine[]> {
  const buf = await file.arrayBuffer();
  const lib = await getLibreDwg();
  const dwg = lib.dwg_read_data(buf, 0 /* Dwg_File_Type.DWG */);
  if (!dwg) {
    throw new Error("Couldn't read the DWG — it may be an unsupported version. Try saving it as an older DWG or as DXF.");
  }
  let db: DwgDb;
  try {
    db = lib.convert(dwg);
  } finally {
    try {
      lib.dwg_free(dwg);
    } catch {
      /* ignore */
    }
  }
  const out: ImportedLine[] = [];
  for (const e of db.entities ?? []) {
    const ll = dwgEntityLatLngs(e);
    if (ll) out.push({ name: e.layer || `DWG ${e.type}`, latlngs: ll });
  }
  return out;
}
