import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { BASEMAPS, ORDER, STATUS_DASH, STATUS_OPACITY } from '../../domain/constants';
import { builderPopupHtml } from '../../domain/builderPopup';
import { computeRisers } from '../../domain/risers';
import { createRiserMarker } from '../../leaflet/riserMarkers';
import type { BasemapId, BuilderLayerCfg, Feature, LineFeature, UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

function tipText(feature: Feature): string {
  return feature.props.name ? feature.props.name : feature.code;
}

/**
 * Mirrors the original's `applyBuilderBasemap` + `syncBuilder` + `builderFit`:
 * rebuilds each network's Leaflet layer group from scratch (styled per the
 * builder's own layer config, not the Asset Manager's status styling) any
 * time layer config or network data changes, and re-fits the map only when
 * the loaded project or its feature counts change.
 */
export function useBuilderMap(
  mapRef: RefObject<L.Map | null>,
  basemap: BasemapId,
  layers: Record<UtilId, BuilderLayerCfg>,
  network: NetworkState,
): void {
  const baseLayersRef = useRef<L.TileLayer[]>([]);
  const groupsRef = useRef<Partial<Record<UtilId, L.LayerGroup>>>({});
  const sigRef = useRef<string | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const l of baseLayersRef.current) map.removeLayer(l);
    const defs = (BASEMAPS[basemap] || BASEMAPS.gray).layers;
    baseLayersRef.current = defs.map(([url, opts]) => L.tileLayer(url, opts).addTo(map));
  }, [mapRef, basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const telecomFeatures = network.networks.telecom.features;

    for (const id of ORDER) {
      const existing = groupsRef.current[id];
      if (existing) map.removeLayer(existing);
      const group = L.layerGroup();
      groupsRef.current[id] = group;
      const cfg = layers[id];
      if (cfg.visible) group.addTo(map);

      for (const f of network.networks[id].features) {
        const status = f.props.status || 'Active';
        const popup = builderPopupHtml(id, f, cfg, telecomFeatures);
        if (f.type === 'line') {
          const dash =
            id === 'telecom'
              ? f.props.placement === 'Underground'
                ? '11 7'
                : status === 'Construction'
                  ? '2 6'
                  : null
              : STATUS_DASH[status] || null;
          L.polyline(f.latlngs, { color: '#ffffff', weight: cfg.weight + 3.5, opacity: 0.9 * cfg.opacity, interactive: false }).addTo(
            group,
          );
          const main = L.polyline(f.latlngs, {
            color: cfg.color,
            weight: cfg.weight,
            opacity: (STATUS_OPACITY[status] ?? 0.95) * cfg.opacity,
            dashArray: dash ?? undefined,
          }).addTo(group);
          main.bindTooltip(tipText(f), { className: 'feat-tip', direction: 'top', opacity: 1 });
          if (popup) main.bindPopup(popup);
        } else {
          const cls = f.type === 'source' ? 'pt-source' : f.type === 'join' ? 'pt-join' : 'pt-delivery';
          const baseOp = (status === 'Abandoned' ? 0.5 : 1) * cfg.opacity;
          const extra = (status === 'Planned' || status === 'Construction' ? 'border-style:dashed;' : '') + `opacity:${baseOp};`;
          const icon = L.divIcon({
            className: 'pt-wrap',
            html: `<div class="pt ${cls}" style="--c:${cfg.color};${extra}"></div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          const marker = L.marker(f.latlng, { icon })
            .bindTooltip(tipText(f), { className: 'feat-tip', direction: 'top', offset: [0, -6], opacity: 1 })
            .addTo(group);
          if (popup) marker.bindPopup(popup);
        }
      }

      if (id === 'telecom') {
        const lines = telecomFeatures.filter((f): f is LineFeature => f.type === 'line');
        for (const riser of computeRisers(lines)) createRiserMarker(riser).addTo(group);
      }
    }

    const sig = `${network.uid}|${ORDER.map((id) => network.networks[id].features.length).join(',')}`;
    if (sig !== sigRef.current) {
      sigRef.current = sig;
      const all: L.LatLngExpression[] = [];
      for (const id of ORDER) {
        for (const f of network.networks[id].features) {
          if (f.type === 'line') for (const ll of f.latlngs) all.push(ll);
          else all.push(f.latlng);
        }
      }
      if (all.length) map.fitBounds(L.latLngBounds(all).pad(0.25));
    }
  }, [mapRef, layers, network]);
}
