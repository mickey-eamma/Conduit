import { useMemo } from 'react';
import { countLineCrossings, type Point2D } from '../../domain/crossingsMath';
import type { ArcgisLayerRecord } from '../../domain/types';
import type { CxLine } from './cxAllLines';

export interface CxLayerCrossing {
  id: string;
  na: boolean;
  total: number;
  perLine: Record<string, number>;
  points: Point2D[];
}

/** Recomputes crossing counts per ArcGIS layer against the selected lines — mirrors the original's `computeCrossings`. */
export function useCrossingResults(arcgisLayers: ArcgisLayerRecord[], allLines: CxLine[], selected: Set<string>): Record<string, CxLayerCrossing> {
  return useMemo(() => {
    const selectedLines = allLines.filter((l) => selected.has(l.code));
    const result: Record<string, CxLayerCrossing> = {};
    for (const rec of arcgisLayers) {
      if (rec.kind !== 'features' || !rec.geojson) {
        result[rec.id] = { id: rec.id, na: true, total: 0, perLine: {}, points: [] };
        continue;
      }
      let total = 0;
      const perLine: Record<string, number> = {};
      const points: Point2D[] = [];
      for (const line of selectedLines) {
        const r = countLineCrossings(line.latlngs, rec.geojson);
        if (r.count) {
          perLine[line.code] = r.count;
          total += r.count;
          points.push(...r.points);
        }
      }
      result[rec.id] = { id: rec.id, na: false, total, perLine, points };
    }
    return result;
  }, [arcgisLayers, allLines, selected]);
}
