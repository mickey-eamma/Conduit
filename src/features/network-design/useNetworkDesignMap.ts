import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import { BASEMAPS } from '../../domain/constants';
import type { BasemapId, LatLng } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';
import { cxAllLines } from '../crossings/cxAllLines';

function waypointIcon(kind: 'start' | 'mid' | 'end') {
  const c = kind === 'start' ? '#16a34a' : kind === 'end' ? '#c2334d' : '#2563eb';
  return L.divIcon({
    className: 'pt-wrap',
    html: `<div style="width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid ${c};box-shadow:var(--shadow-sm)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

/**
 * Owns the Network Design map's non-editing layers: basemap tiles, a faint
 * read-only preview of every existing line (for street-following context),
 * the start/waypoint/end markers, and the routed-line preview. Vertex editing
 * handles are a separate concern (useRouteVertexEditing). Mirrors the
 * original's `ndSync`/`ndFit`/`ndRenderWaypoints`/`ndDrawRoute`.
 */
export function useNetworkDesignMap(
  mapRef: RefObject<L.Map | null>,
  basemap: BasemapId,
  network: NetworkState,
  waypoints: LatLng[],
  routeLatLngs: LatLng[] | null,
  onMapClick: (ll: LatLng) => void,
): void {
  const baseLayersRef = useRef<L.TileLayer[]>([]);
  const ctxGroupRef = useRef<L.LayerGroup | null>(null);
  const wpGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const fitDoneRef = useRef(false);
  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  // Unconditionally (re)creates the groups and tears them down in the matching
  // cleanup — NOT a `if (!ref.current) create` guard. `mapRef` is a stable ref
  // object whose *identity* never changes, so this effect only runs once per
  // real map instance; but React 19 StrictMode's dev-only double-invoke
  // destroys the first map and creates a second one within that single mount,
  // and a guard keyed on "did I already create a group" would leave that group
  // permanently orphaned on the destroyed map. Resetting the refs to null in
  // cleanup lets the second (real) invocation recreate them against the live map.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ctxGroup = L.layerGroup().addTo(map);
    const wpGroup = L.layerGroup().addTo(map);
    ctxGroupRef.current = ctxGroup;
    wpGroupRef.current = wpGroup;
    const handler = (e: L.LeafletMouseEvent) => onMapClickRef.current(e.latlng);
    map.on('click', handler);
    return () => {
      map.off('click', handler);
      map.removeLayer(ctxGroup);
      map.removeLayer(wpGroup);
      ctxGroupRef.current = null;
      wpGroupRef.current = null;
      fitDoneRef.current = false;
    };
  }, [mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const l of baseLayersRef.current) map.removeLayer(l);
    const defs = (BASEMAPS[basemap] || BASEMAPS.gray).layers;
    baseLayersRef.current = defs.map(([url, opts]) => L.tileLayer(url, opts).addTo(map));
  }, [mapRef, basemap]);

  useEffect(() => {
    const group = ctxGroupRef.current;
    if (!group) return;
    group.clearLayers();
    for (const l of cxAllLines(network)) {
      L.polyline(l.latlngs, { color: l.color, weight: 2, opacity: 0.35, interactive: false }).addTo(group);
    }
  }, [network]);

  useEffect(() => {
    const map = mapRef.current;
    const allLines = cxAllLines(network);
    if (!map || fitDoneRef.current || !allLines.length) return;
    fitDoneRef.current = true;
    const all: L.LatLngExpression[] = [];
    for (const l of allLines) for (const ll of l.latlngs) all.push(ll);
    map.fitBounds(L.latLngBounds(all).pad(0.25), { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot fit, mirrors ndFit() called once right after init
  }, [mapRef]);

  useEffect(() => {
    const group = wpGroupRef.current;
    if (!group) return;
    group.clearLayers();
    const n = waypoints.length;
    waypoints.forEach((ll, i) => {
      const kind = i === 0 ? 'start' : i === n - 1 ? 'end' : 'mid';
      L.marker(ll, { icon: waypointIcon(kind), interactive: false, zIndexOffset: 1300 }).addTo(group);
    });
  }, [waypoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (routeLayerRef.current) {
      map?.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (!map || !routeLatLngs) return;
    routeLayerRef.current = L.layerGroup([
      L.polyline(routeLatLngs, { color: '#ffffff', weight: 7, opacity: 0.9, interactive: false }),
      L.polyline(routeLatLngs, { color: '#7c4ddb', weight: 4, opacity: 0.95, interactive: false }),
    ]).addTo(map);
  }, [mapRef, routeLatLngs]);
}
