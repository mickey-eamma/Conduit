import type { FeatureCollection } from 'geojson';
import { ORDER } from '../domain/constants';
import defaultSample from '../domain/defaultSample.json';
import type { UtilId } from '../domain/types';
import type { SerializedFeature, SerializedProject } from './persistence';

const VALID_ROLES = new Set(['line', 'source', 'join', 'delivery']);

/**
 * Converts a Conduit-exported GeoJSON FeatureCollection back into the
 * internal editable project format (inverse of exportGeoJSON, Phase 14).
 * Risers are skipped — the app auto-recomputes them from aerial/underground
 * crossings.
 */
export function geojsonToProject(gj: FeatureCollection): SerializedProject {
  const networks = {} as SerializedProject['networks'];
  for (const id of ORDER) networks[id] = { features: [] };
  let maxNum = 0;

  for (const f of gj?.features ?? []) {
    const p = (f.properties ?? {}) as Record<string, unknown>;
    const net = p.network as UtilId | undefined;
    const role = p.role as string | undefined;
    const g = f.geometry;
    if (!net || !networks[net]) continue;
    if (!role || !VALID_ROLES.has(role)) continue;

    const props: SerializedFeature['props'] = {
      name: (p.name as string) || '',
      status: (p.status as SerializedFeature['props']['status']) || 'Active',
    };
    if (role === 'line' && net === 'telecom') {
      props.fiberCount = (p.fiber_count as number) || 48;
      props.placement = (p.placement as 'Aerial' | 'Underground') || 'Aerial';
    }
    if (role === 'join') {
      if (net === 'telecom') {
        props.parentLine = (p.parent_line as string) || '';
        props.branches = ((p.branches as { line?: string; fiber_from?: number; fiber_to?: number }[]) ?? []).map((b) => ({
          line: b.line || '',
          from: b.fiber_from ?? '',
          to: b.fiber_to ?? '',
        }));
        props.splices = ((p.fiber_splices as { in_fiber: number; out_line: string; out_fiber: number }[]) ?? []).map(
          (c) => ({ inFiber: c.in_fiber, outLine: c.out_line, outFiber: c.out_fiber }),
        );
      } else if (net === 'water' || net === 'oilgas') {
        props.fromLine = (p.from_line as string) || '';
        const toLines = p.to_lines as string[] | undefined;
        props.toLines = Array.isArray(toLines) ? toLines.filter(Boolean) : p.to_line ? [p.to_line as string] : [];
      } else {
        props.fromLine = (p.from_line as string) || '';
        props.toLine = (p.to_line as string) || '';
      }
    }

    const code = (p.id as string) || '';
    const feature: SerializedFeature =
      role === 'line'
        ? {
            type: 'line',
            code,
            props,
            latlngs: (g && g.type === 'LineString' ? g.coordinates : []).map(
              ([lng, lat]): [number, number] => [lat, lng],
            ),
          }
        : {
            type: role as SerializedFeature['type'],
            code,
            props,
            latlng: (() => {
              const c = g && g.type === 'Point' ? g.coordinates : [0, 0];
              return [c[1], c[0]] as [number, number];
            })(),
          };

    networks[net].features.push(feature);
    const m = /(\d+)\s*$/.exec(code);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }

  return { uid: maxNum + 1, networks };
}

/** The starter/sample network shown before any client is saved or loaded. */
export function defaultProject(): SerializedProject | null {
  const proj = geojsonToProject(defaultSample as FeatureCollection);
  const hasAny = ORDER.some((id) => proj.networks[id].features.length > 0);
  return hasAny ? proj : null;
}
