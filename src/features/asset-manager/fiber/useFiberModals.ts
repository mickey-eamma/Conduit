import { useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { UTILS } from '../../../domain/constants';
import { fiberTrace, type FiberTraceHop } from '../../../domain/fiber';
import { featureById, lineByCode } from '../../../state/network/networkSelectors';
import type { LineFeature, PointFeature } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

export interface TraceResult {
  cable: string;
  fiber: number;
  seq: FiberTraceHop[];
}

export interface UseFiberModalsResult {
  matrixFeature: PointFeature | null;
  cableTableLine: LineFeature | null;
  trace: TraceResult | null;
  openMatrix: (feature: PointFeature) => void;
  closeMatrix: () => void;
  openCableTable: (line: LineFeature) => void;
  closeCableTable: () => void;
  runTrace: (cable: string, fiber: number) => void;
  closeTrace: () => void;
  isAnyOpen: boolean;
}

/**
 * Owns which fiber modal is open (splice matrix / cable table / signal
 * trace) and the map-highlight halos for an active trace. Mirrors the
 * original's openMatrix/openFiberTable/runTrace/closeTrace state machine.
 */
export function useFiberModals(mapRef: RefObject<L.Map | null>, network: NetworkState): UseFiberModalsResult {
  const [matrixFeatureId, setMatrixFeatureId] = useState<string | null>(null);
  const [cableTableLineId, setCableTableLineId] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceResult | null>(null);
  const haloesRef = useRef<L.Polyline[]>([]);

  const matrixFeature = matrixFeatureId ? (featureById(network, 'telecom', matrixFeatureId) as PointFeature | undefined) : undefined;
  const cableTableLine = cableTableLineId
    ? (featureById(network, 'telecom', cableTableLineId) as LineFeature | undefined)
    : undefined;

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    haloesRef.current.forEach((h) => map.removeLayer(h));
    haloesRef.current = [];
    if (!trace) return;

    const seen = new Set<string>();
    const all: L.LatLng[] = [];
    for (const s of trace.seq) {
      if (seen.has(s.cable)) continue;
      seen.add(s.cable);
      const ln = lineByCode(network, 'telecom', s.cable);
      if (!ln) continue;
      const halo = L.polyline(ln.latlngs, { color: UTILS.telecom.color, weight: 11, opacity: 0.32, interactive: false }).addTo(map);
      haloesRef.current.push(halo);
      ln.latlngs.forEach((ll) => all.push(L.latLng(ll.lat, ll.lng)));
    }
    if (all.length) map.fitBounds(L.latLngBounds(all).pad(0.35));

    return () => {
      haloesRef.current.forEach((h) => map.removeLayer(h));
      haloesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when trace itself changes
  }, [trace, mapRef]);

  return {
    matrixFeature: matrixFeature ?? null,
    cableTableLine: cableTableLine ?? null,
    trace,
    openMatrix: (feature) => setMatrixFeatureId(feature.id),
    closeMatrix: () => setMatrixFeatureId(null),
    openCableTable: (line) => setCableTableLineId(line.id),
    closeCableTable: () => setCableTableLineId(null),
    runTrace: (cable, fiber) => setTrace({ cable, fiber, seq: fiberTrace(network.networks.telecom.features, cable, fiber) }),
    closeTrace: () => setTrace(null),
    isAnyOpen: !!matrixFeatureId || !!cableTableLineId || !!trace,
  };
}
