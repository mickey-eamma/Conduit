import { useEffect, useRef, useState, type Dispatch, type RefObject } from 'react';
import L from 'leaflet';
import { ORDER } from '../../domain/constants';
import { coincident } from '../../domain/geometry';
import type { LatLng, LineFeature, UtilId } from '../../domain/types';
import type { NetworkAction, NetworkState } from '../../state/network/networkTypes';

interface DragConnection {
  lines: { util: UtilId; id: string; endIndex: number }[];
  points: { util: UtilId; id: string }[];
}

export interface UseGeometryEditingResult {
  editingFeatureId: string | null;
  toggleEdit: (feature: LineFeature) => void;
}

/**
 * Draggable vertex handles + clickable midpoints for editing a line's
 * geometry. Dragging an endpoint also drags any coincident endpoints/points
 * of OTHER features in lockstep (mirrors the original's dragConn behavior).
 * Geometry updates dispatch to NetworkContext on every drag tick (not just
 * dragend) — useFeatureLayerSync reacts to that and keeps every affected
 * Leaflet layer in sync, so this hook only has to own its own handle markers.
 */
export function useGeometryEditing(
  mapRef: RefObject<L.Map | null>,
  network: NetworkState,
  networkDispatch: Dispatch<NetworkAction>,
  onToast: (message: string) => void,
  selectedFeatureId: string | null,
  tool: string,
): UseGeometryEditingResult {
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);

  const networkRef = useRef(network);
  networkRef.current = network;
  const editingUtilRef = useRef<UtilId | null>(null);
  // Mirrors editingFeatureId synchronously. Callbacks created inside
  // buildHandles() (mid-marker click, vert-marker drag) close over whatever
  // was true at buildHandles-call-time — since buildHandles runs in the same
  // tick as setEditingFeatureId, those closures would otherwise see a stale
  // (pre-update) editingFeatureId forever. Reading the ref instead avoids that.
  const editingFeatureIdRef = useRef<string | null>(null);
  const vertMarkersRef = useRef<L.Marker[]>([]);
  const midMarkersRef = useRef<L.Marker[]>([]);
  const dragConnRef = useRef<DragConnection | null>(null);
  const workingLatLngsRef = useRef<LatLng[] | null>(null);

  function currentFeature(): LineFeature | null {
    const util = editingUtilRef.current;
    const id = editingFeatureIdRef.current;
    if (!util || !id) return null;
    const f = networkRef.current.networks[util].features.find((x) => x.id === id);
    return f && f.type === 'line' ? f : null;
  }

  function clearHandles() {
    const map = mapRef.current;
    vertMarkersRef.current.forEach((m) => map?.removeLayer(m));
    vertMarkersRef.current = [];
    midMarkersRef.current.forEach((m) => map?.removeLayer(m));
    midMarkersRef.current = [];
  }

  function updateMidPositions(latlngs: LatLng[]) {
    midMarkersRef.current.forEach((m, k) => {
      const a = latlngs[k];
      const b = latlngs[k + 1];
      if (a && b) m.setLatLng([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2]);
    });
  }

  function buildHandles(latlngs: LatLng[]) {
    clearHandles();
    const map = mapRef.current;
    // Guard on the ref (set synchronously in startEdit), not currentFeature() —
    // this can run in the same tick as setEditingFeatureId, before that state
    // update has flushed, so reading editingFeatureId here would be stale.
    if (!map || !editingUtilRef.current) return;
    const n = latlngs.length;

    latlngs.forEach((ll, i) => {
      const isEnd = i === 0 || i === n - 1;
      const size = isEnd ? 16 : 13;
      const icon = L.divIcon({
        className: 'pt-wrap',
        html: `<div class="edit-vert${isEnd ? ' end' : ''}"></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });
      const marker = L.marker(L.latLng(ll.lat, ll.lng), { draggable: true, icon, zIndexOffset: 1000 });
      marker.on('dragstart', () => onVertDragStart(i));
      marker.on('drag', (e) => onVertDrag(i, (e.target as L.Marker).getLatLng()));
      marker.on('dragend', onVertDragEnd);
      marker.on('contextmenu', (e) => {
        if (e.originalEvent) {
          e.originalEvent.preventDefault();
          e.originalEvent.stopPropagation();
        }
        deleteVertexAt(i);
      });
      marker.addTo(map);
      vertMarkersRef.current.push(marker);
    });

    for (let i = 0; i < n - 1; i++) {
      const a = latlngs[i];
      const b = latlngs[i + 1];
      const mid = L.marker([(a.lat + b.lat) / 2, (a.lng + b.lng) / 2], {
        icon: L.divIcon({ className: 'pt-wrap', html: '<div class="edit-mid">+</div>', iconSize: [16, 16], iconAnchor: [8, 8] }),
        zIndexOffset: 900,
      });
      mid.on('click', (e) => {
        L.DomEvent.stop(e);
        insertVertexAt(i + 1);
      });
      mid.addTo(map);
      midMarkersRef.current.push(mid);
    }
  }

  function stopEdit() {
    clearHandles();
    editingFeatureIdRef.current = null;
    setEditingFeatureId(null);
    editingUtilRef.current = null;
    dragConnRef.current = null;
    workingLatLngsRef.current = null;
  }

  function startEdit(feature: LineFeature) {
    stopEdit();
    editingUtilRef.current = feature.util;
    editingFeatureIdRef.current = feature.id;
    setEditingFeatureId(feature.id);
    buildHandles(feature.latlngs);
    onToast(
      'Drag a vertex to move it · click a + to add one · right-click a vertex to delete. Dragging an endpoint pulls connected lines and splices along.',
    );
  }

  function toggleEdit(feature: LineFeature) {
    if (editingFeatureId === feature.id) stopEdit();
    else startEdit(feature);
  }

  function onVertDragStart(i: number) {
    const feat = currentFeature();
    dragConnRef.current = null;
    workingLatLngsRef.current = feat ? feat.latlngs.map((ll) => ({ ...ll })) : null;
    if (!feat) return;
    const n = feat.latlngs.length;
    if (i !== 0 && i !== n - 1) return;

    const p = feat.latlngs[i];
    const lines: DragConnection['lines'] = [];
    const points: DragConnection['points'] = [];
    for (const util of ORDER) {
      for (const f of networkRef.current.networks[util].features) {
        if (f.id === feat.id && util === feat.util) continue;
        if (f.type === 'line') {
          [0, f.latlngs.length - 1].forEach((ei) => {
            if (coincident(f.latlngs[ei], p)) lines.push({ util, id: f.id, endIndex: ei });
          });
        } else if (coincident(f.latlng, p)) {
          points.push({ util, id: f.id });
        }
      }
    }
    dragConnRef.current = { lines, points };
  }

  function onVertDrag(i: number, newLL: L.LatLng) {
    const feat = currentFeature();
    const working = workingLatLngsRef.current;
    if (!feat || !working) return;
    working[i] = { lat: newLL.lat, lng: newLL.lng };
    networkDispatch({ type: 'UPDATE_FEATURE_GEOMETRY_LINE', util: feat.util, id: feat.id, latlngs: working });
    updateMidPositions(working);

    const conn = dragConnRef.current;
    if (!conn) return;
    for (const { util, id, endIndex } of conn.lines) {
      const f = networkRef.current.networks[util].features.find((x) => x.id === id);
      if (f && f.type === 'line') {
        const latlngs = f.latlngs.map((ll, idx) => (idx === endIndex ? { lat: newLL.lat, lng: newLL.lng } : ll));
        networkDispatch({ type: 'UPDATE_FEATURE_GEOMETRY_LINE', util, id, latlngs });
      }
    }
    for (const { util, id } of conn.points) {
      networkDispatch({ type: 'UPDATE_FEATURE_GEOMETRY_POINT', util, id, latlng: { lat: newLL.lat, lng: newLL.lng } });
    }
  }

  function onVertDragEnd() {
    dragConnRef.current = null;
    workingLatLngsRef.current = null;
  }

  function deleteVertexAt(i: number) {
    const feat = currentFeature();
    if (!feat) return;
    if (feat.latlngs.length <= 2) {
      onToast('A line needs at least two vertices.');
      return;
    }
    const latlngs = feat.latlngs.filter((_, idx) => idx !== i);
    networkDispatch({ type: 'UPDATE_FEATURE_GEOMETRY_LINE', util: feat.util, id: feat.id, latlngs });
    buildHandles(latlngs);
  }

  function insertVertexAt(index: number) {
    const feat = currentFeature();
    if (!feat) return;
    const a = feat.latlngs[index - 1];
    const b = feat.latlngs[index];
    const vertex: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
    const latlngs = [...feat.latlngs.slice(0, index), vertex, ...feat.latlngs.slice(index)];
    networkDispatch({ type: 'UPDATE_FEATURE_GEOMETRY_LINE', util: feat.util, id: feat.id, latlngs });
    buildHandles(latlngs);
  }

  // Deselecting or selecting a different feature stops geometry editing
  // (mirrors deselect()'s unconditional stopEditGeometry).
  useEffect(() => {
    if (editingFeatureId && selectedFeatureId !== editingFeatureId) stopEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to selection changes
  }, [selectedFeatureId]);

  // Switching to any non-pan tool also exits geometry editing (mirrors setTool's stopEditGeometry).
  useEffect(() => {
    if (tool !== 'pan') stopEdit();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to tool changes
  }, [tool]);

  useEffect(() => {
    return () => clearHandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cleanup only, on unmount
  }, []);

  return { editingFeatureId, toggleEdit };
}
