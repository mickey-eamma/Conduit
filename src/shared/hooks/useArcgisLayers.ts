import { useRef, useState, type RefObject } from 'react';
import L from 'leaflet';
import { agsFetchJson, agsNormalize, agsQueryFeatures, type Bbox } from '../../lib/arcgisRest';
import { agsGeoJsonLayer } from '../../leaflet/agsGeoJsonLayer';
import type { GeoJSONWithLimit } from '../../domain/esriJson';
import type { ArcgisLayerRecord } from '../../domain/types';

export interface ArcgisStatus {
  message: string;
  isErr: boolean;
}

export interface UseArcgisLayersOptions {
  idPrefix: string;
  palette: string[];
}

export interface UseArcgisLayersResult {
  layers: ArcgisLayerRecord[];
  status: ArcgisStatus | null;
  setStatus: (status: ArcgisStatus | null) => void;
  busy: boolean;
  addFromUrl: (url: string, bbox?: Bbox | null) => Promise<void>;
  addFeatureLayerData: (title: string, url: string, gj: GeoJSONWithLimit, opts?: { color?: string; fit?: boolean }) => number;
  toggleLayer: (id: string) => void;
  removeLayer: (id: string) => void;
  reloadLayersInView: (bbox: Bbox) => Promise<{ total: number; capped: boolean }>;
}

/**
 * Consolidated ArcGIS REST layer loader shared by Map Builder and Crossings
 * (the original had near-identical `ags*` and `cx*` implementations). Layer
 * metadata lives in React state; the live Leaflet layer objects never do —
 * they're kept in a side-table ref, matching the app's general Leaflet/state
 * decoupling pattern.
 */
export function useArcgisLayers(mapRef: RefObject<L.Map | null>, opts: UseArcgisLayersOptions): UseArcgisLayersResult {
  const [layers, setLayers] = useState<ArcgisLayerRecord[]>([]);
  const [status, setStatus] = useState<ArcgisStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const layerObjectsRef = useRef(new Map<string, L.Layer>());
  const nextIdRef = useRef(1);

  function addFeatureLayerData(title: string, url: string, gj: GeoJSONWithLimit, dataOpts?: { color?: string; fit?: boolean }): number {
    const map = mapRef.current;
    const color = dataOpts?.color ?? opts.palette[(nextIdRef.current - 1) % opts.palette.length];
    const id = opts.idPrefix + nextIdRef.current++;
    const layerObj = agsGeoJsonLayer(gj, color);
    if (map) layerObj.addTo(map);
    layerObjectsRef.current.set(id, layerObj);
    setLayers((prev) => [...prev, { id, title, url, color, visible: true, kind: 'features', geojson: gj }]);
    if (dataOpts?.fit !== false && map) {
      try {
        const b = (layerObj as L.GeoJSON).getBounds();
        if (b.isValid()) map.fitBounds(b.pad(0.2));
      } catch {
        /* empty geometry */
      }
    }
    return gj.features?.length ?? 0;
  }

  function addTileLayerData(url: string, meta: Record<string, unknown>): void {
    const map = mapRef.current;
    const id = opts.idPrefix + nextIdRef.current++;
    const tileUrl = url + '/tile/{z}/{y}/{x}';
    const tileAttribution = (meta.copyrightText as string) || 'ArcGIS';
    const layerObj = L.tileLayer(tileUrl, { maxZoom: 19, attribution: tileAttribution });
    if (map) layerObj.addTo(map);
    layerObjectsRef.current.set(id, layerObj);
    const title = (meta.mapName as string) || (meta.name as string) || 'Tiled service';
    setLayers((prev) => [...prev, { id, title, url, color: '#64748b', visible: true, kind: 'tiles', tileUrl, tileAttribution }]);
  }

  async function addFromUrl(rawUrl: string, bbox?: Bbox | null): Promise<void> {
    const url = agsNormalize(rawUrl);
    if (!url) {
      setStatus({ message: 'Paste an ArcGIS REST endpoint URL first.', isErr: true });
      return;
    }
    if (!/(feature|map|image)server/i.test(url)) {
      setStatus({ message: 'That doesn’t look like an ArcGIS REST endpoint (expecting a FeatureServer/MapServer URL).', isErr: true });
      return;
    }
    setBusy(true);
    setStatus({ message: 'Loading…', isErr: false });
    try {
      const meta = await agsFetchJson(url);
      if (meta.geometryType || (typeof meta.type === 'string' && /layer/i.test(meta.type))) {
        const gj = await agsQueryFeatures(url, bbox);
        const n = addFeatureLayerData((meta.name as string) || url.split('/').slice(-2).join(' '), url, gj);
        setStatus({
          message: `Added “${(meta.name as string) || 'layer'}” · ${n} feature${n !== 1 ? 's' : ''}${bbox ? ' in view' : ''}${gj.exceededTransferLimit ? ' (capped at server limit)' : ''}.`,
          isErr: false,
        });
      } else if (meta.singleFusedMapCache) {
        addTileLayerData(url, meta);
        setStatus({ message: `Added tiled service “${(meta.mapName as string) || (meta.name as string) || 'layer'}”.`, isErr: false });
      } else if (Array.isArray(meta.layers) && meta.layers.length) {
        const subs = (meta.layers as { id: number; name?: string; subLayerIds?: number[] }[]).filter(
          (l) => !(l.subLayerIds && l.subLayerIds.length),
        );
        if (!subs.length) throw new Error('No drawable layers in this service.');
        let added = 0;
        let total = 0;
        let truncated = false;
        for (const l of subs) {
          try {
            const lurl = url + '/' + l.id;
            const gj = await agsQueryFeatures(lurl, bbox);
            total += addFeatureLayerData(l.name || 'Layer ' + l.id, lurl, gj);
            truncated = truncated || !!gj.exceededTransferLimit;
            added++;
          } catch {
            /* skip layers that won't query */
          }
        }
        if (!added) throw new Error('Couldn’t load any layers from this service.');
        setStatus({
          message: `Added ${added} layer${added !== 1 ? 's' : ''} · ${total} feature${total !== 1 ? 's' : ''}${truncated ? ' (some truncated)' : ''}.`,
          isErr: false,
        });
      } else {
        throw new Error('Unsupported endpoint — point to a Feature Layer, service, or cached MapServer.');
      }
    } catch (err) {
      setStatus({ message: 'Couldn’t add layer: ' + (err instanceof Error ? err.message : String(err)), isErr: true });
    } finally {
      setBusy(false);
    }
  }

  function toggleLayer(id: string): void {
    const map = mapRef.current;
    setLayers((prev) =>
      prev.map((rec) => {
        if (rec.id !== id) return rec;
        const nextVisible = !rec.visible;
        const layerObj = layerObjectsRef.current.get(id);
        if (layerObj && map) {
          if (nextVisible) layerObj.addTo(map);
          else map.removeLayer(layerObj);
        }
        return { ...rec, visible: nextVisible };
      }),
    );
  }

  function removeLayer(id: string): void {
    const map = mapRef.current;
    const layerObj = layerObjectsRef.current.get(id);
    if (layerObj && map) map.removeLayer(layerObj);
    layerObjectsRef.current.delete(id);
    setLayers((prev) => prev.filter((rec) => rec.id !== id));
  }

  async function reloadLayersInView(bbox: Bbox): Promise<{ total: number; capped: boolean }> {
    const map = mapRef.current;
    const featureLayers = layers.filter((r) => r.kind === 'features');
    let total = 0;
    let capped = false;
    for (const rec of featureLayers) {
      try {
        const gj = await agsQueryFeatures(rec.url, bbox);
        const oldLayer = layerObjectsRef.current.get(rec.id);
        if (oldLayer && map) map.removeLayer(oldLayer);
        const newLayer = agsGeoJsonLayer(gj, rec.color);
        layerObjectsRef.current.set(rec.id, newLayer);
        if (rec.visible && map) newLayer.addTo(map);
        total += gj.features?.length ?? 0;
        capped = capped || !!gj.exceededTransferLimit;
        setLayers((prev) => prev.map((r) => (r.id === rec.id ? { ...r, geojson: gj } : r)));
      } catch {
        /* skip layers that fail to reload */
      }
    }
    return { total, capped };
  }

  return { layers, status, setStatus, busy, addFromUrl, addFeatureLayerData, toggleLayer, removeLayer, reloadLayersInView };
}
