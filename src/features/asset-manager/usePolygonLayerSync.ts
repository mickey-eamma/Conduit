import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { LAND_GROUP } from '../../domain/constants';
import { LAND_STYLE } from '../../domain/landStyle';
import { getPolygonStyle } from '../../domain/statusStyle';
import type { PolygonFeature, UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';
import type { FeatureClickHandler } from './useFeatureLayerSync';

function tipText(feature: PolygonFeature): string {
  return feature.props.name ? feature.props.name : feature.code;
}

export interface PolygonLayerAccess {
  getEntry(util: UtilId, id: string): L.Polygon | undefined;
}

/**
 * One-way sync for the Land group (site/lease/building under `land`, plain
 * polygons under `parcel`) — mirrors useFeatureLayerSync's structure, kept
 * as its own hook since polygon styling (LAND_STYLE) and interactions
 * (no post-hoc geometry editing) genuinely differ from the line/point path.
 */
export function usePolygonLayerSync(
  mapRef: RefObject<L.Map | null>,
  network: NetworkState,
  onFeatureClick: FeatureClickHandler,
): PolygonLayerAccess {
  const groupsRef = useRef<Record<UtilId, L.LayerGroup> | null>(null);
  const registriesRef = useRef<Record<UtilId, Map<string, L.Polygon>> | null>(null);
  const onFeatureClickRef = useRef(onFeatureClick);
  onFeatureClickRef.current = onFeatureClick;

  useEffect(() => {
    const map = mapRef.current;
    if (!map || groupsRef.current) return;

    const groups = {} as Record<UtilId, L.LayerGroup>;
    const registries = {} as Record<UtilId, Map<string, L.Polygon>>;
    for (const id of LAND_GROUP) {
      groups[id] = L.layerGroup().addTo(map);
      registries[id] = new Map();
    }
    groupsRef.current = groups;
    registriesRef.current = registries;

    return () => {
      for (const id of LAND_GROUP) groups[id].remove();
      groupsRef.current = null;
      registriesRef.current = null;
    };
  }, [mapRef]);

  useEffect(() => {
    const groups = groupsRef.current;
    const registries = registriesRef.current;
    const map = mapRef.current;
    if (!groups || !registries || !map) return;

    for (const util of LAND_GROUP) {
      const bucket = network.networks[util];
      const registry = registries[util];
      const group = groups[util];
      const currentIds = new Set(bucket.features.map((f) => f.id));

      if (bucket.visible !== map.hasLayer(group)) {
        if (bucket.visible) group.addTo(map);
        else map.removeLayer(group);
      }

      for (const [id, poly] of registry) {
        if (!currentIds.has(id)) {
          group.removeLayer(poly);
          registry.delete(id);
        }
      }

      for (const feature of bucket.features as PolygonFeature[]) {
        const base = LAND_STYLE[feature.type];
        const style = getPolygonStyle(feature);
        const existing = registry.get(feature.id);

        if (!existing) {
          const poly = L.polygon(feature.latlngs, {
            color: base.color,
            weight: base.weight,
            fill: base.fill,
            fillColor: base.fillColor,
            dashArray: style.dashArray ?? undefined,
            opacity: style.opacity,
            fillOpacity: style.fillOpacity,
          });
          poly.on('click', (ev) => onFeatureClickRef.current(feature, ev));
          poly.bindTooltip(tipText(feature), { className: 'feat-tip', direction: 'top', opacity: 1 });
          poly.addTo(group);
          registry.set(feature.id, poly);
        } else {
          existing.setLatLngs(feature.latlngs);
          existing.setStyle({ dashArray: style.dashArray ?? undefined, opacity: style.opacity, fillOpacity: style.fillOpacity });
          existing.setTooltipContent(tipText(feature));
        }
      }
    }
  }, [network]);

  return {
    getEntry: (util, id) => registriesRef.current?.[util].get(id),
  };
}
