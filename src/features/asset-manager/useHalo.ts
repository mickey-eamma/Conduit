import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { UTILS } from '../../domain/constants';
import { downOf, isFlowNet } from '../../domain/flow';
import { featureById, lineByCode } from '../../state/network/networkSelectors';
import type { UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

/**
 * Draws the selection halo (thick translucent outline around the selected
 * feature) and relation halos (highlighting the lines a selected join
 * connects). Purely reactive: redraws whenever the selection or the
 * network's geometry changes, which also makes it track vertex drags live
 * without any extra plumbing.
 */
export function useHalo(
  mapRef: RefObject<L.Map | null>,
  network: NetworkState,
  selectedUtil: UtilId,
  selectedFeatureId: string | null,
): void {
  const haloRef = useRef<L.Path | null>(null);
  const relHalosRef = useRef<L.Polyline[]>([]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (haloRef.current) {
      map.removeLayer(haloRef.current);
      haloRef.current = null;
    }
    relHalosRef.current.forEach((h) => map.removeLayer(h));
    relHalosRef.current = [];

    if (!selectedFeatureId) return;
    const feature = featureById(network, selectedUtil, selectedFeatureId);
    if (!feature) return;

    const accent = UTILS[feature.util].color;
    if (feature.type === 'line') {
      haloRef.current = L.polyline(feature.latlngs, { color: accent, weight: 9, opacity: 0.25, interactive: false }).addTo(map);
    } else {
      haloRef.current = L.circleMarker(feature.latlng, {
        radius: 13,
        color: accent,
        weight: 2,
        dashArray: '3 3',
        fill: false,
        interactive: false,
      }).addTo(map);
    }

    if (feature.type === 'join') {
      let codes: (string | undefined)[];
      if (feature.util === 'telecom') {
        codes = [feature.props.parentLine, ...(feature.props.branches ?? []).map((b) => b.line)];
      } else if (isFlowNet(feature.util)) {
        codes = [feature.props.fromLine, ...downOf(feature)];
      } else {
        codes = [feature.props.fromLine, feature.props.toLine];
      }
      for (const code of codes) {
        if (!code) continue;
        const ln = lineByCode(network, feature.util, code);
        if (ln) relHalosRef.current.push(L.polyline(ln.latlngs, { color: accent, weight: 10, opacity: 0.28, interactive: false }).addTo(map));
      }
    }
  }, [mapRef, network, selectedUtil, selectedFeatureId]);
}
