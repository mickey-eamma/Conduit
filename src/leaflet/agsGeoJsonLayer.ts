import L from 'leaflet';
import type { FeatureCollection } from 'geojson';
import { agsPopupHtml } from '../lib/arcgisRest';

export function agsGeoJsonLayer(gj: FeatureCollection, color: string): L.GeoJSON {
  return L.geoJSON(gj, {
    style: { color, weight: 2.5, opacity: 0.9, fillColor: color, fillOpacity: 0.15 },
    pointToLayer: (_f, latlng) => L.circleMarker(latlng, { radius: 5, color: '#fff', weight: 1.5, fillColor: color, fillOpacity: 0.95 }),
    onEachFeature: (f, layer) => layer.bindPopup(agsPopupHtml(f.properties)),
  });
}
