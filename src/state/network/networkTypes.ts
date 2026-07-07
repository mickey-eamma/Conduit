import { ORDER } from '../../domain/constants';
import type { Feature, FeatureProps, LatLng, NetworkBucket, NetworksData, UtilId } from '../../domain/types';

export interface NetworkState {
  uid: number;
  networks: NetworksData;
}

function emptyNetworksData(): NetworksData {
  const networks = {} as NetworksData;
  for (const id of ORDER) {
    networks[id] = { visible: true, features: [] } satisfies NetworkBucket;
  }
  return networks;
}

export const initialNetworkState: NetworkState = {
  uid: 1,
  networks: emptyNetworksData(),
};

export type NetworkAction =
  | { type: 'ADD_LINE'; util: UtilId; latlngs: LatLng[]; name?: string }
  | { type: 'ADD_POINT'; util: UtilId; featureType: 'source' | 'join' | 'delivery'; latlng: LatLng }
  | { type: 'UPDATE_FEATURE_PROPS'; util: UtilId; id: string; props: Partial<FeatureProps> }
  | { type: 'UPDATE_FEATURE_GEOMETRY_LINE'; util: UtilId; id: string; latlngs: LatLng[] }
  | { type: 'UPDATE_FEATURE_GEOMETRY_POINT'; util: UtilId; id: string; latlng: LatLng }
  | { type: 'DELETE_FEATURE'; util: UtilId; id: string }
  | { type: 'SET_NETWORK_VISIBLE'; util: UtilId; visible: boolean }
  | { type: 'LOAD_PROJECT'; uid: number; networks: Record<UtilId, { features: Feature[] }> }
  | { type: 'RESET_PROJECT' };
