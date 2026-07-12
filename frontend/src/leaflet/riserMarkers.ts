import L from 'leaflet';
import type { RiserPoint } from '../domain/types';

const RISER_ICON_HTML =
  '<svg width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8.5" fill="#fff" stroke="#3a3f47" stroke-width="1.6"/><path d="M11 15.5V7M7.6 10.4 11 7l3.4 3.4" fill="none" stroke="#3a3f47" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export function createRiserMarker(riser: RiserPoint): L.Marker {
  const icon = L.divIcon({ className: 'pt-wrap', iconSize: [22, 22], iconAnchor: [11, 11], html: RISER_ICON_HTML });
  const marker = L.marker(riser.latlng, { icon });
  marker.bindTooltip('Riser · aerial ⇄ underground', { className: 'feat-tip', direction: 'top', offset: [0, -9] });
  return marker;
}
