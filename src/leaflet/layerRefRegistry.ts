import type L from 'leaflet';

/**
 * A plain side-table mapping domain keys (feature id, widget id, ArcGIS
 * layer id, ...) to live Leaflet layer instances. This is the decoupling
 * point that replaces the original app's pattern of storing `feat.layer`/
 * `feat.marker` directly on domain objects — Leaflet objects never enter
 * React state, they live only here, keyed the same way the corresponding
 * domain data is keyed.
 */
export interface LayerRefRegistry<K extends string = string> {
  set(key: K, layer: L.Layer): void;
  get(key: K): L.Layer | undefined;
  delete(key: K): void;
  keys(): IterableIterator<K>;
  clear(): void;
}

export function createLayerRegistry<K extends string = string>(): LayerRefRegistry<K> {
  const map = new Map<K, L.Layer>();
  return {
    set: (key, layer) => void map.set(key, layer),
    get: (key) => map.get(key),
    delete: (key) => void map.delete(key),
    keys: () => map.keys(),
    clear: () => map.clear(),
  };
}
