import type { FeatureCollection, Feature as GeoJSONFeature } from 'geojson';
import { ORDER, UTILS } from '../domain/constants';
import { effectiveFiberCount } from '../domain/fiber';
import { lineLengthMeters } from '../domain/geometry';
import { computeRisers } from '../domain/risers';
import type { LineFeature } from '../domain/types';
import type { NetworkState } from '../state/network/networkTypes';

/** The canonical on-disk GeoJSON schema — also what geojsonToProject (the inverse importer) understands. */
export function projectToGeoJSON(network: NetworkState): FeatureCollection {
  const features: GeoJSONFeature[] = [];

  for (const id of ORDER) {
    const u = UTILS[id];
    const telecomFeatures = network.networks.telecom.features;
    for (const f of network.networks[id].features) {
      const props: Record<string, unknown> = {
        id: f.code,
        name: f.props.name || null,
        status: f.props.status,
        network: id,
        network_label: u.label,
        role: f.type,
        type_label: u.terms[f.type],
      };
      if (f.type === 'join') {
        if (id === 'telecom') {
          props.parent_line = f.props.parentLine || null;
          props.branches = (f.props.branches ?? [])
            .filter((b) => b.line)
            .map((b) => ({ line: b.line, fiber_from: b.from || null, fiber_to: b.to || null }));
          props.fiber_splices = (f.props.splices ?? []).map((c) => ({
            in_fiber: c.inFiber,
            out_line: c.outLine,
            out_fiber: c.outFiber,
          }));
        } else if (id === 'water' || id === 'oilgas') {
          props.from_line = f.props.fromLine || null;
          props.to_lines = (f.props.toLines ?? (f.props.toLine ? [f.props.toLine] : [])).filter(Boolean);
        } else {
          props.from_line = f.props.fromLine || null;
          props.to_line = f.props.toLine || null;
        }
      }

      if (f.type === 'line') {
        const lp: Record<string, unknown> = { ...props, length_m: Math.round(lineLengthMeters(f.latlngs)) };
        if (id === 'telecom') {
          lp.fiber_count = effectiveFiberCount(f, telecomFeatures) || null;
          lp.placement = f.props.placement || 'Aerial';
        }
        features.push({
          type: 'Feature',
          properties: lp,
          geometry: { type: 'LineString', coordinates: f.latlngs.map((ll) => [ll.lng, ll.lat]) },
        });
      } else if (f.type === 'source' || f.type === 'join' || f.type === 'delivery') {
        features.push({
          type: 'Feature',
          properties: props,
          geometry: { type: 'Point', coordinates: [f.latlng.lng, f.latlng.lat] },
        });
      }
    }
  }

  const telecomLines = network.networks.telecom.features.filter((f): f is LineFeature => f.type === 'line');
  for (const riser of computeRisers(telecomLines)) {
    features.push({
      type: 'Feature',
      properties: { network: 'telecom', network_label: 'Telecom', role: 'riser', type_label: 'Riser (aerial⇄underground)' },
      geometry: { type: 'Point', coordinates: [riser.latlng.lng, riser.latlng.lat] },
    });
  }

  return { type: 'FeatureCollection', features };
}

export function exportGeoJSON(network: NetworkState): void {
  const geojson = projectToGeoJSON(network);
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'conduit-networks.geojson';
  a.click();
  URL.revokeObjectURL(a.href);
}
