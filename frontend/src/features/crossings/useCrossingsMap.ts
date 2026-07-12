import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import type { ArcgisLayerRecord } from '../../domain/types';
import type { CxLine } from './cxAllLines';
import type { CxLayerCrossing } from './useCrossingResults';

/**
 * Mirrors the original's `syncCrossings` line/marker drawing and the
 * one-shot `cxFit()` call made right after `initCrossings()` — crossings,
 * unlike Map Builder, does NOT re-fit the map as the project changes later.
 */
export function useCrossingsMap(
  mapRef: RefObject<L.Map | null>,
  allLines: CxLine[],
  selected: Set<string>,
  onLineClick: (code: string) => void,
  arcgisLayers: ArcgisLayerRecord[],
  crossingResults: Record<string, CxLayerCrossing>,
): void {
  const lineGroupRef = useRef<L.LayerGroup | null>(null);
  const xGroupRef = useRef<L.LayerGroup | null>(null);
  const fitDoneRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!lineGroupRef.current) lineGroupRef.current = L.layerGroup().addTo(map);
    if (!xGroupRef.current) xGroupRef.current = L.layerGroup().addTo(map);
  }, [mapRef]);

  useEffect(() => {
    const group = lineGroupRef.current;
    if (!group) return;
    group.clearLayers();
    for (const l of allLines) {
      const on = selected.has(l.code);
      const pl = L.polyline(l.latlngs, { color: on ? l.color : '#9aa1ac', weight: on ? 4.5 : 2, opacity: on ? 0.95 : 0.5 });
      pl.on('click', () => onLineClick(l.code));
      pl.bindTooltip(l.name, { className: 'feat-tip', direction: 'top', opacity: 1 });
      pl.addTo(group);
    }
  }, [allLines, selected, onLineClick]);

  useEffect(() => {
    const group = xGroupRef.current;
    if (!group) return;
    group.clearLayers();
    for (const rec of arcgisLayers) {
      if (rec.kind !== 'features' || !rec.visible) continue;
      const result = crossingResults[rec.id];
      if (!result) continue;
      for (const p of result.points) {
        L.circleMarker([p[1], p[0]], { radius: 4.5, color: '#fff', weight: 1.5, fillColor: rec.color, fillOpacity: 1, interactive: false }).addTo(
          group,
        );
      }
    }
  }, [arcgisLayers, crossingResults]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || fitDoneRef.current || !allLines.length) return;
    fitDoneRef.current = true;
    const all: L.LatLngExpression[] = [];
    for (const l of allLines) for (const ll of l.latlngs) all.push(ll);
    map.fitBounds(L.latLngBounds(all).pad(0.25), { animate: false });
  }, [mapRef, allLines]);
}
