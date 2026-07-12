import { coincident } from './geometry';
import type { LatLng, LineFeature, RiserPoint } from './types';

/**
 * Auto-computed wherever an aerial cable vertex is coincident with an
 * underground cable vertex (telecom-only). Pure function — the single
 * consolidated implementation shared by the main app and (later) the Deploy
 * Asset Map generator, replacing what was 3 separate copies in the original.
 */
export function computeRisers(telecomLines: LineFeature[]): RiserPoint[] {
  const aerial = telecomLines.filter((l) => (l.props.placement || 'Aerial') === 'Aerial');
  const underground = telecomLines.filter((l) => l.props.placement === 'Underground');

  const spots: LatLng[] = [];
  for (const a of aerial) {
    for (const u of underground) {
      for (const pa of a.latlngs) {
        for (const pu of u.latlngs) {
          if (coincident(pa, pu) && !spots.some((s) => coincident(s, pa))) spots.push(pa);
        }
      }
    }
  }

  return spots.map((latlng, i) => ({ id: `riser-${i}-${latlng.lat}-${latlng.lng}`, latlng }));
}
