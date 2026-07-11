import L from 'leaflet';
import { BASEMAPS } from '../domain/constants';
import type { BasemapId } from '../domain/types';

/** The Asset Manager map always uses this fixed gray-canvas + reference pair (no basemap picker there). */
export function createAssetManagerBasemapLayers(): L.TileLayer[] {
  return createBasemapLayers('gray');
}

/** Builds the tile layers for a named basemap preset (used by Map Builder / Crossings, which can switch). */
export function createBasemapLayers(id: BasemapId): L.TileLayer[] {
  return BASEMAPS[id].layers.map(([url, options]) => L.tileLayer(url, options));
}
