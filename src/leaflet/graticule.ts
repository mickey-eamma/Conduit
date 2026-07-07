import L from 'leaflet';

export function intervalForZoom(z: number): number {
  if (z >= 16) return 0.002;
  if (z >= 14) return 0.005;
  if (z >= 12) return 0.02;
  if (z >= 10) return 0.05;
  if (z >= 8) return 0.2;
  if (z >= 6) return 0.5;
  return 1;
}

const MINOR_STYLE: L.PolylineOptions = { color: '#d6d0c2', weight: 1, opacity: 0.8, interactive: false };
const MAJOR_STYLE: L.PolylineOptions = { color: '#bfb7a6', weight: 1.4, opacity: 0.9, interactive: false };

/**
 * Redraws the offline-basemap fallback grid into `group` for the map's
 * current view. Called on mount and on every moveend/zoomend while tiles
 * haven't successfully loaded yet (see useOfflineBasemapFallback).
 */
export function drawGraticule(map: L.Map, group: L.LayerGroup): void {
  group.clearLayers();
  const bounds = map.getBounds();
  const step = intervalForZoom(map.getZoom());
  const s = Math.floor(bounds.getSouth() / step) * step;
  const n = Math.ceil(bounds.getNorth() / step) * step;
  const w = Math.floor(bounds.getWest() / step) * step;
  const e = Math.ceil(bounds.getEast() / step) * step;

  for (let lat = s; lat <= n + 1e-9; lat += step) {
    const style = Math.round(lat / step) % 5 === 0 ? MAJOR_STYLE : MINOR_STYLE;
    group.addLayer(L.polyline([[lat, bounds.getWest()], [lat, bounds.getEast()]], style));
  }
  for (let lng = w; lng <= e + 1e-9; lng += step) {
    const style = Math.round(lng / step) % 5 === 0 ? MAJOR_STYLE : MINOR_STYLE;
    group.addLayer(L.polyline([[bounds.getSouth(), lng], [bounds.getNorth(), lng]], style));
  }
}
