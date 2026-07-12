import { isPolyType, MODES } from '../domain/constants';
import { Store } from './store';
import type { Feature, FeatureProps, FeatureType, LineFeature, PointFeature, PolygonFeature, UtilId } from '../domain/types';
import type { NetworkState } from '../state/network/networkTypes';

export const CLIENTS_KEY = 'conduit:clients';
export const LAST_KEY = 'conduit:lastClient';

/** The on-disk shape saved per client — matches the original app's serializeProject() exactly (no `id`; it's re-derived as `code` on load). */
export interface SerializedFeature {
  type: FeatureType;
  code: string;
  props: FeatureProps;
  latlngs?: [number, number][];
  latlng?: [number, number];
}

export interface SerializedProject {
  uid: number;
  networks: Record<UtilId, { features: SerializedFeature[] }>;
  savedAt?: number;
}

function isPathFeature(f: Feature): f is LineFeature | PolygonFeature {
  return f.type === 'line' || isPolyType(f.type);
}

export function serializeProject(network: NetworkState): SerializedProject {
  const networks = {} as SerializedProject['networks'];
  for (const id of MODES) {
    networks[id] = {
      features: network.networks[id].features.map((f): SerializedFeature => ({
        type: f.type,
        code: f.code,
        props: f.props,
        latlngs: isPathFeature(f) ? f.latlngs.map((ll): [number, number] => [ll.lat, ll.lng]) : undefined,
        latlng: !isPathFeature(f) ? ([f.latlng.lat, f.latlng.lng] as [number, number]) : undefined,
      })),
    };
  }
  return { uid: network.uid, networks };
}

export function deserializeProject(proj: SerializedProject): { uid: number; networks: Record<UtilId, { features: Feature[] }> } {
  const networks = {} as Record<UtilId, { features: Feature[] }>;
  for (const id of MODES) {
    const features: Feature[] = (proj.networks[id]?.features ?? []).map((f) => {
      if (f.type === 'line' || isPolyType(f.type)) {
        const latlngs = (f.latlngs ?? []).map(([lat, lng]) => ({ lat, lng }));
        return { id: f.code, type: f.type, util: id, code: f.code, props: f.props, latlngs } as LineFeature | PolygonFeature;
      }
      const [lat, lng] = f.latlng ?? [0, 0];
      return { id: f.code, type: f.type, util: id, code: f.code, props: f.props, latlng: { lat, lng } } as PointFeature;
    });
    networks[id] = { features };
  }
  return { uid: proj.uid || 1, networks };
}

export async function loadClients(): Promise<Record<string, SerializedProject>> {
  const raw = await Store.get(CLIENTS_KEY);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function persistClients(clients: Record<string, SerializedProject>): Promise<void> {
  await Store.set(CLIENTS_KEY, JSON.stringify(clients));
}
