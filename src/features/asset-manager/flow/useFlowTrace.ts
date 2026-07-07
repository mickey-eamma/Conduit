import { useEffect, useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { UTILS } from '../../../domain/constants';
import { flowLevels } from '../../../domain/flow';
import { lineByCode } from '../../../state/network/networkSelectors';
import type { LineFeature, UtilId } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';

export interface FlowTraceState {
  util: UtilId;
  startCode: string;
  dir: 'up' | 'down';
  levels: string[][];
}

export interface UseFlowTraceResult {
  trace: FlowTraceState | null;
  runTrace: (line: LineFeature, dir: 'up' | 'down') => void;
  closeTrace: () => void;
}

/**
 * Owns the water/oil-gas up/downstream trace: BFS levels + the map halo
 * highlighting (start pipe in dark accent, everything else in the network
 * color) + fitBounds, mirroring the original's traceFlow/openFlowGraph.
 */
export function useFlowTrace(mapRef: RefObject<L.Map | null>, network: NetworkState): UseFlowTraceResult {
  const [trace, setTrace] = useState<FlowTraceState | null>(null);
  const haloesRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    haloesRef.current.forEach((h) => map.removeLayer(h));
    haloesRef.current = [];
    if (!trace) return;

    const color = UTILS[trace.util].color;
    const codes = trace.levels.flat();
    const all: L.LatLng[] = [];
    for (const code of codes) {
      const ln = lineByCode(network, trace.util, code);
      if (!ln) continue;
      const isStart = code === trace.startCode;
      const halo = L.polyline(ln.latlngs, {
        color: isStart ? '#1f2430' : color,
        weight: isStart ? 7 : 11,
        opacity: isStart ? 0.55 : 0.34,
        interactive: false,
      }).addTo(map);
      haloesRef.current.push(halo);
      ln.latlngs.forEach((ll) => all.push(L.latLng(ll.lat, ll.lng)));
    }
    if (all.length) map.fitBounds(L.latLngBounds(all).pad(0.3));

    return () => {
      haloesRef.current.forEach((h) => map.removeLayer(h));
      haloesRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when trace itself changes
  }, [trace, mapRef]);

  return {
    trace,
    runTrace: (line, dir) =>
      setTrace({ util: line.util, startCode: line.code, dir, levels: flowLevels(network.networks[line.util].features, line.code, dir) }),
    closeTrace: () => setTrace(null),
  };
}
