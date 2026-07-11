import { useEffect, useMemo, useRef } from 'react';
import type L from 'leaflet';
import { computeRisers } from '../../domain/risers';
import { createRiserMarker } from '../../leaflet/riserMarkers';
import type { LineFeature } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';
import type { FeatureLayerAccess } from './useFeatureLayerSync';

/**
 * Derives risers from telecom line features (never stored in NetworkContext
 * — recomputed whenever the underlying geometry/placement changes) and syncs
 * them as markers into the telecom network's Leaflet layer group.
 */
export function useRisers(network: NetworkState, layerAccess: FeatureLayerAccess): void {
  const registryRef = useRef(new Map<string, L.Marker>());

  const telecomLines = network.networks.telecom.features.filter((f): f is LineFeature => f.type === 'line');
  const risers = useMemo(() => computeRisers(telecomLines), [telecomLines]);

  useEffect(() => {
    const group = layerAccess.getGroup('telecom');
    if (!group) return;
    const registry = registryRef.current;
    const currentIds = new Set(risers.map((r) => r.id));

    for (const [id, marker] of registry) {
      if (!currentIds.has(id)) {
        group.removeLayer(marker);
        registry.delete(id);
      }
    }
    for (const riser of risers) {
      if (registry.has(riser.id)) continue;
      const marker = createRiserMarker(riser);
      marker.addTo(group);
      registry.set(riser.id, marker);
    }
  }, [risers, layerAccess]);
}
