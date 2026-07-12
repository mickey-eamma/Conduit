import type L from 'leaflet';
import type { PointStyle } from '../domain/statusStyle';

/**
 * Status styling for point markers is a direct DOM write into the divIcon's
 * inner element — kept imperative on purpose since the marker's HTML is
 * Leaflet-owned, not React-rendered (see original applyStatusStyle).
 */
export function applyPointStyle(marker: L.Marker, style: PointStyle): void {
  const el = marker.getElement();
  if (!el) return;
  const dot = el.querySelector<HTMLElement>('.pt');
  if (!dot) return;
  dot.style.opacity = String(style.opacity);
  dot.style.borderStyle = style.borderStyle;
}
