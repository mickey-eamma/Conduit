import { ORDER, defaultLayerCfg } from '../../../domain/constants';
import type { BuilderLayerCfg, UtilId } from '../../../domain/types';
import type { SerializedProject } from '../../../lib/persistence';
import type { DeployComposition, DeployPayload } from './deployTypes';

function defaultLayers(): Record<UtilId, BuilderLayerCfg> {
  const layers = {} as Record<UtilId, BuilderLayerCfg>;
  for (const id of ORDER) layers[id] = defaultLayerCfg(id);
  return layers;
}

/** Mirrors the original's `makePayload` — fills in defaults for a client with no saved composition yet. */
export function makePayload(
  clientName: string,
  networks: SerializedProject['networks'],
  comp?: Partial<DeployComposition> & { generated?: string },
): DeployPayload {
  return {
    client: clientName,
    generated: comp?.generated || new Date().toLocaleString(),
    networks,
    layers: comp?.layers || defaultLayers(),
    basemap: comp?.basemap || 'gray',
    widgets: comp?.widgets || [],
    view: comp?.view || null,
    arcgis: comp?.arcgis || [],
  };
}
