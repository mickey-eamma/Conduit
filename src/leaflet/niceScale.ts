import type L from 'leaflet';

export interface ScaleReading {
  px: number;
  label: string;
}

/** Picks a "nice" round ground distance (1/1.5/2/3/5/10 × 10^n) that fits within maxPx on screen. */
export function niceScale(map: L.Map, maxPx: number): ScaleReading {
  const y = Math.round(map.getSize().y / 2);
  const d = map.distance(map.containerPointToLatLng([0, y]), map.containerPointToLatLng([maxPx, y]));
  if (!(d > 0)) return { px: maxPx, label: '' };
  const pow = Math.pow(10, Math.floor(Math.log(d) / Math.LN10));
  let best = pow;
  for (const c of [1, 1.5, 2, 3, 5, 10]) {
    if (c * pow <= d) best = c * pow;
  }
  const label = best >= 1000 ? `${Math.round(best / 100) / 10} km` : `${Math.round(best)} m`;
  return { px: Math.round((maxPx * best) / d), label };
}
