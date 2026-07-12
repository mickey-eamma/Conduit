import { ORDER, UTILS } from '../../domain/constants';
import type { LatLng, UtilId } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

export interface CxLine {
  util: UtilId;
  code: string;
  name: string;
  latlngs: LatLng[];
  color: string;
}

/** Flattens every drawn line across all 4 networks, in display order — mirrors the original's `cxAllLines`. */
export function cxAllLines(network: NetworkState): CxLine[] {
  const out: CxLine[] = [];
  for (const id of ORDER) {
    for (const f of network.networks[id].features) {
      if (f.type === 'line') out.push({ util: id, code: f.code, name: f.props.name || f.code, latlngs: f.latlngs, color: UTILS[id].color });
    }
  }
  return out;
}
