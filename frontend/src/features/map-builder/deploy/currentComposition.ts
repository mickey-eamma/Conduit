import type L from 'leaflet';
import type { RefObject } from 'react';
import type { BasemapId, BuilderLayerCfg, UtilId, Widget, ArcgisLayerRecord } from '../../../domain/types';
import type { DeployArcgisLayer, DeployComposition } from './deployTypes';

/** Mirrors the original's `currentComposition()` — snapshots the Builder's live map view + ArcGIS layers for deploy. */
export function currentComposition(
  mapRef: RefObject<L.Map | null>,
  arcgisLayers: ArcgisLayerRecord[],
  layers: Record<UtilId, BuilderLayerCfg>,
  basemap: BasemapId,
  widgets: Widget[],
): DeployComposition {
  const map = mapRef.current;
  const view = map ? { center: [map.getCenter().lat, map.getCenter().lng] as [number, number], zoom: map.getZoom() } : null;
  const arcgis: DeployArcgisLayer[] = arcgisLayers.map((r) =>
    r.kind === 'tiles'
      ? { kind: 'tiles', title: r.title, visible: r.visible, tileUrl: r.tileUrl ?? '', tileOpts: { maxZoom: 19, attribution: r.tileAttribution } }
      : { kind: 'features', title: r.title, color: r.color, visible: r.visible, geojson: r.geojson ?? { type: 'FeatureCollection', features: [] } },
  );
  return { layers, basemap, widgets, view, arcgis };
}
