import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { ORDER, UTILS } from '../../domain/constants';
import { getLineStyle, getPointStyle } from '../../domain/statusStyle';
import { applyPointStyle } from '../../leaflet/applyPointStyle';
import type { Feature, PointFeature, UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

function tipText(feature: Feature): string {
  return feature.props.name ? feature.props.name : feature.code;
}

function pointClass(type: Feature['type']): string {
  if (type === 'source') return 'pt-source';
  if (type === 'join') return 'pt-join';
  return 'pt-delivery';
}

export type FeatureClickHandler = (feature: Feature, ev: L.LeafletMouseEvent) => void;

type FeatureLayerEntry =
  | { kind: 'line'; group: L.LayerGroup; casing: L.Polyline; main: L.Polyline }
  | { kind: 'point'; marker: L.Marker };

export interface FeatureLayerAccess {
  getEntry(util: UtilId, id: string): FeatureLayerEntry | undefined;
  getGroup(util: UtilId): L.LayerGroup | undefined;
}

/**
 * One-way sync: NetworkContext features -> Leaflet layers. Never stores
 * Leaflet objects in React state — layers live only in the per-util registry
 * maps here, keyed by feature id. Creates layers for new features, removes
 * layers for deleted features, and updates geometry/tooltip/status styling
 * in place for existing ones (so vertex-drag geometry edits and prop edits
 * from the attribute panel both flow straight through to the map).
 */
export function useFeatureLayerSync(
  mapRef: RefObject<L.Map | null>,
  network: NetworkState,
  onFeatureClick: FeatureClickHandler,
  onTelecomJoinDoubleClick?: (feature: PointFeature) => void,
): FeatureLayerAccess {
  const groupsRef = useRef<Record<UtilId, L.LayerGroup> | null>(null);
  const registriesRef = useRef<Record<UtilId, Map<string, FeatureLayerEntry>> | null>(null);
  const onFeatureClickRef = useRef(onFeatureClick);
  const onTelecomJoinDoubleClickRef = useRef(onTelecomJoinDoubleClick);
  onTelecomJoinDoubleClickRef.current = onTelecomJoinDoubleClick;
  onFeatureClickRef.current = onFeatureClick;

  // Create the 4 network layer groups once, when the map becomes available.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || groupsRef.current) return;

    const groups = {} as Record<UtilId, L.LayerGroup>;
    const registries = {} as Record<UtilId, Map<string, FeatureLayerEntry>>;
    for (const id of ORDER) {
      groups[id] = L.layerGroup().addTo(map);
      registries[id] = new Map();
    }
    groupsRef.current = groups;
    registriesRef.current = registries;

    return () => {
      for (const id of ORDER) groups[id].remove();
      groupsRef.current = null;
      registriesRef.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const groups = groupsRef.current;
    const registries = registriesRef.current;
    const map = mapRef.current;
    if (!groups || !registries || !map) return;

    for (const util of ORDER) {
      const bucket = network.networks[util];
      const registry = registries[util];
      const group = groups[util];
      const currentIds = new Set(bucket.features.map((f) => f.id));

      if (bucket.visible !== map.hasLayer(group)) {
        if (bucket.visible) group.addTo(map);
        else map.removeLayer(group);
      }

      for (const [id, entry] of registry) {
        if (!currentIds.has(id)) {
          group.removeLayer(entry.kind === 'line' ? entry.group : entry.marker);
          registry.delete(id);
        }
      }

      for (const feature of bucket.features) {
        const color = UTILS[feature.util].color;
        const existing = registry.get(feature.id);

        if (feature.type === 'line') {
          const style = getLineStyle(feature);
          const leafletStyle = { dashArray: style.dashArray ?? undefined, opacity: style.opacity };
          if (!existing) {
            const casing = L.polyline(feature.latlngs, { color: '#ffffff', weight: 7, opacity: 0.9 });
            const main = L.polyline(feature.latlngs, { color, weight: 3.5, ...leafletStyle });
            const group2 = L.layerGroup([casing, main]);
            main.on('click', (ev) => onFeatureClickRef.current(feature, ev));
            main.bindTooltip(tipText(feature), { className: 'feat-tip', direction: 'top', opacity: 1 });
            group2.addTo(group);
            registry.set(feature.id, { kind: 'line', group: group2, casing, main });
          } else if (existing.kind === 'line') {
            existing.casing.setLatLngs(feature.latlngs);
            existing.main.setLatLngs(feature.latlngs);
            existing.main.setStyle(leafletStyle);
            existing.main.setTooltipContent(tipText(feature));
          }
        } else {
          if (!existing) {
            const icon = L.divIcon({
              className: 'pt-wrap',
              html: `<div class="pt ${pointClass(feature.type)}" style="--c:${color}"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9],
            });
            const marker = L.marker(feature.latlng, { icon });
            marker.on('click', (ev) => onFeatureClickRef.current(feature, ev));
            if (feature.type === 'join' && feature.util === 'telecom') {
              marker.on('dblclick', (ev) => {
                L.DomEvent.stop(ev);
                onTelecomJoinDoubleClickRef.current?.(feature);
              });
            }
            marker.bindTooltip(tipText(feature), {
              className: 'feat-tip',
              direction: 'top',
              offset: [0, -6],
              opacity: 1,
            });
            marker.addTo(group);
            registry.set(feature.id, { kind: 'point', marker });
            applyPointStyle(marker, getPointStyle(feature));
          } else if (existing.kind === 'point') {
            existing.marker.setLatLng(feature.latlng);
            existing.marker.setTooltipContent(tipText(feature));
            applyPointStyle(existing.marker, getPointStyle(feature));
          }
        }
      }
    }
  }, [network]);

  return {
    getEntry: (util, id) => registriesRef.current?.[util].get(id),
    getGroup: (util) => groupsRef.current?.[util],
  };
}
