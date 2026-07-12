import { useEffect, useRef, useState, type Dispatch, type RefObject } from 'react';
import L from 'leaflet';
import { isPathTool, isPolyType, UTILS } from '../../domain/constants';
import { nearestWithin } from '../../domain/geometry';
import type { Feature, LatLng, PointFeature, ToolId, UtilId } from '../../domain/types';
import type { NetworkAction } from '../../state/network/networkTypes';
import type { NetworkState } from '../../state/network/networkTypes';
import type { UiAction, UiState } from '../../state/ui/uiTypes';
import type { LandContext } from './useLandContext';
import { useFeatureLayerSync, type FeatureLayerAccess } from './useFeatureLayerSync';

const SNAP_PX = 14;

function toLatLng(ll: LatLng): L.LatLng {
  return L.latLng(ll.lat, ll.lng);
}

export interface UseAssetMapInteractionsResult {
  coords: string;
  layerAccess: FeatureLayerAccess;
  handleFeatureClick: (feature: Feature, ev: L.LeafletMouseEvent) => void;
}

/**
 * Owns draw/select/delete interaction for the Asset Manager map: snapping,
 * draft line/polygon preview while placing vertices, point placement,
 * feature selection/deletion, and the drawing-related keyboard shortcuts.
 * Renders feature layers via useFeatureLayerSync and routes their click
 * events back through the same tool-based branching as map-background
 * clicks (mirrors the original app's onMapClick/onFeatureClick).
 */
export function useAssetMapInteractions(
  mapRef: RefObject<L.Map | null>,
  ui: UiState,
  uiDispatch: Dispatch<UiAction>,
  network: NetworkState,
  networkDispatch: Dispatch<NetworkAction>,
  isActive: boolean,
  suppressShortcuts = false,
  onTelecomJoinDoubleClick?: (feature: PointFeature) => void,
  landCtx?: LandContext,
): UseAssetMapInteractionsResult {
  const [coords, setCoords] = useState('—');
  const suppressShortcutsRef = useRef(suppressShortcuts);
  suppressShortcutsRef.current = suppressShortcuts;

  // "Latest value" refs so map-level listeners (attached once) always see
  // current UI state without needing to be torn down/recreated.
  const toolRef = useRef<ToolId>(ui.tool);
  toolRef.current = ui.tool;
  const utilRef = useRef<UtilId>(ui.selectedUtil);
  utilRef.current = ui.selectedUtil;
  const snapRef = useRef<boolean>(ui.snapEnabled);
  snapRef.current = ui.snapEnabled;
  const networkRef = useRef(network);
  networkRef.current = network;
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const landCtxRef = useRef<LandContext>(landCtx ?? { site: '', lease: '' });
  landCtxRef.current = landCtx ?? { site: '', lease: '' };

  const draftLatLngsRef = useRef<L.LatLng[]>([]);
  const draftLayerRef = useRef<L.Polyline | null>(null);
  const draftVertsRef = useRef<L.LayerGroup | null>(null);

  function snapPoints(): LatLng[] {
    const pts: LatLng[] = [];
    for (const f of networkRef.current.networks[utilRef.current].features) {
      if ('latlngs' in f) pts.push(...f.latlngs);
      else pts.push(f.latlng);
    }
    return pts;
  }

  function snap(latlng: L.LatLng): L.LatLng {
    const map = mapRef.current;
    if (!snapRef.current || !map) return latlng;
    const target = map.latLngToContainerPoint(latlng);
    const candidates = snapPoints().map((ll) => ({
      point: map.latLngToContainerPoint(toLatLng(ll)),
      value: ll,
    }));
    const best = nearestWithin(target, candidates, SNAP_PX);
    return best ? toLatLng(best) : latlng;
  }

  // Enforces the Land hierarchy: a lease needs a parent Site, a building needs a parent Lease.
  function landParentReady(tool: ToolId): boolean {
    const landFeatures = networkRef.current.networks.land.features;
    if (tool === 'lease') {
      const site = landCtxRef.current.site;
      if (!site || !landFeatures.some((f) => f.code === site)) {
        uiDispatch({ type: 'SHOW_TOAST', message: 'Select a parent Site for this lease first.' });
        return false;
      }
    }
    if (tool === 'building') {
      const lease = landCtxRef.current.lease;
      if (!lease || !landFeatures.some((f) => f.code === lease)) {
        uiDispatch({ type: 'SHOW_TOAST', message: 'Select a parent Lease for this building first.' });
        return false;
      }
    }
    return true;
  }

  function isVertex(ll: L.LatLng): boolean {
    return draftLatLngsRef.current.some((v) => v.lat === ll.lat && v.lng === ll.lng);
  }

  function previewLine(mouse?: L.LatLng) {
    const map = mapRef.current;
    if (!map) return;
    const pts = draftLatLngsRef.current.concat(mouse && !isVertex(mouse) ? [mouse] : []);
    const color = UTILS[utilRef.current].color;
    if (draftLayerRef.current) map.removeLayer(draftLayerRef.current);
    draftLayerRef.current = L.polyline(pts, { color, weight: 3, opacity: 0.85, dashArray: '6 6' }).addTo(map);
    if (draftVertsRef.current) map.removeLayer(draftVertsRef.current);
    draftVertsRef.current = L.layerGroup(
      draftLatLngsRef.current.map((ll) =>
        L.marker(ll, {
          icon: L.divIcon({ className: 'vertex-dot', html: '<div></div>', iconSize: [14, 14], iconAnchor: [7, 7] }),
          interactive: false,
        }),
      ),
    ).addTo(map);
  }

  function addVertex(ll: L.LatLng) {
    draftLatLngsRef.current.push(ll);
    previewLine(ll);
  }

  function cancelLine() {
    const map = mapRef.current;
    draftLatLngsRef.current = [];
    if (draftLayerRef.current) {
      map?.removeLayer(draftLayerRef.current);
      draftLayerRef.current = null;
    }
    if (draftVertsRef.current) {
      map?.removeLayer(draftVertsRef.current);
      draftVertsRef.current = null;
    }
  }

  function finishLine() {
    const tool = toolRef.current;
    if (isPolyType(tool)) {
      if (draftLatLngsRef.current.length >= 3) {
        const predictedId = String(networkRef.current.uid);
        const latlngs: LatLng[] = draftLatLngsRef.current.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
        networkDispatch({
          type: 'ADD_POLYGON',
          util: utilRef.current,
          polyType: tool,
          latlngs,
          parentSite: landCtxRef.current.site,
          parentLease: landCtxRef.current.lease,
        });
        // Mirrors main's `commitPolygon`, which auto-selects the new polygon (unlike `commitLine`, which doesn't).
        uiDispatch({ type: 'SELECT_FEATURE', id: predictedId });
      }
    } else if (draftLatLngsRef.current.length >= 2) {
      const latlngs: LatLng[] = draftLatLngsRef.current.map((ll) => ({ lat: ll.lat, lng: ll.lng }));
      networkDispatch({ type: 'ADD_LINE', util: utilRef.current, latlngs });
    }
    cancelLine();
  }

  function addPoint(type: 'source' | 'join' | 'delivery', latlng: L.LatLng) {
    const predictedId = String(networkRef.current.uid);
    networkDispatch({
      type: 'ADD_POINT',
      util: utilRef.current,
      featureType: type,
      latlng: { lat: latlng.lat, lng: latlng.lng },
    });
    if (type === 'join') uiDispatch({ type: 'SELECT_FEATURE', id: predictedId });
  }

  function handleFeatureClick(feature: Feature, ev: L.LeafletMouseEvent) {
    L.DomEvent.stop(ev);
    const tool = toolRef.current;
    if (tool === 'delete') {
      networkDispatch({ type: 'DELETE_FEATURE', util: feature.util, id: feature.id });
      return;
    }
    if (tool === 'line') {
      addVertex(snap(ev.latlng));
      return;
    }
    if (isPolyType(tool)) {
      if (landParentReady(tool)) addVertex(ev.latlng);
      return;
    }
    if (tool === 'source' || tool === 'join' || tool === 'delivery') {
      addPoint(tool, snap(ev.latlng));
      return;
    }
    uiDispatch({ type: 'SELECT_FEATURE', id: feature.id });
  }

  const layerAccess = useFeatureLayerSync(mapRef, network, handleFeatureClick, onTelecomJoinDoubleClick);

  // Map-level click/mousemove listeners, attached once.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onClick = (e: L.LeafletMouseEvent) => {
      const tool = toolRef.current;
      if (tool === 'line') addVertex(snap(e.latlng));
      else if (isPolyType(tool)) {
        if (landParentReady(tool)) addVertex(e.latlng);
      } else if (tool === 'source' || tool === 'join' || tool === 'delivery') addPoint(tool, snap(e.latlng));
      else if (tool === 'pan') uiDispatch({ type: 'DESELECT' });
    };
    const onDblClick = () => {
      if (isPathTool(toolRef.current)) finishLine();
    };
    const onMouseMove = (e: L.LeafletMouseEvent) => {
      setCoords(`${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`);
      if (isPathTool(toolRef.current) && draftLatLngsRef.current.length) previewLine(e.latlng);
    };

    map.on('click', onClick);
    map.on('dblclick', onDblClick);
    map.on('mousemove', onMouseMove);

    return () => {
      map.off('click', onClick);
      map.off('dblclick', onDblClick);
      map.off('mousemove', onMouseMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handlers read latest state via refs
  }, [mapRef]);

  // Drawing-related keyboard shortcuts (Enter/Escape while drawing, Escape to
  // deselect, v/l/s/j/d/x tool shortcuts).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!isActiveRef.current) return;
      if (suppressShortcutsRef.current) return; // a fiber/flow modal is open and handles its own Escape
      const active = document.activeElement;
      if (active && ['INPUT', 'SELECT', 'TEXTAREA'].includes(active.tagName)) return;

      if (isPathTool(toolRef.current)) {
        if (e.key === 'Enter') finishLine();
        if (e.key === 'Escape') cancelLine();
      }
      if (e.key === 'Escape') uiDispatch({ type: 'DESELECT' });

      const keys: Record<string, ToolId> = { v: 'pan', l: 'line', s: 'source', j: 'join', d: 'delivery', x: 'delete' };
      const tool = keys[e.key];
      if (tool && !e.metaKey && !e.ctrlKey) uiDispatch({ type: 'SET_TOOL', tool });
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handler reads latest state via refs
  }, []);

  // Cancel any in-progress line/polygon draw when switching away from a path tool
  // (mirrors setTool's cancelLine-if-leaving-line behavior).
  useEffect(() => {
    if (!isPathTool(ui.tool)) cancelLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to tool changes
  }, [ui.tool]);

  // Cancel any in-progress line/polygon draw when switching networks, even if
  // still in a path tool (mirrors setUtil's unconditional cancelLine).
  useEffect(() => {
    cancelLine();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to network switches
  }, [ui.selectedUtil]);

  return { coords, layerAccess, handleFeatureClick };
}
