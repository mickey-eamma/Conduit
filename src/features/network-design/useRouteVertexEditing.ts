import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';
import type { LatLng } from '../../domain/types';

/**
 * Draggable vertex handles + clickable midpoints over the local (not-yet-committed)
 * route array. Mirrors useGeometryEditing's handle-building, but simpler: no
 * NetworkContext dispatch and no dragging of connected features — this is a
 * local draft edited before it's ever added to a network.
 *
 * Handles are rebuilt only when `routeVersion` changes (a wholly new route
 * landed, was undone, or cleared) — not on every drag tick, so a marker isn't
 * torn down out from under an in-progress drag gesture.
 */
export function useRouteVertexEditing(
  mapRef: RefObject<L.Map | null>,
  routeLatLngs: LatLng[] | null,
  routeVersion: number,
  setRouteLatLngs: (latlngs: LatLng[]) => void,
  markEdited: () => void,
  onToast: (message: string) => void,
): void {
  const latestRouteRef = useRef<LatLng[] | null>(routeLatLngs);
  latestRouteRef.current = routeLatLngs;
  const vertMarkersRef = useRef<L.Marker[]>([]);
  const midMarkersRef = useRef<L.Marker[]>([]);
  const workingRef = useRef<LatLng[] | null>(null);

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
    if (!map) return;
    const n = latlngs.length;

    latlngs.forEach((ll, i) => {
      const isEnd = i === 0 || i === n - 1;
      const size = isEnd ? 16 : 13;
      const marker = L.marker(L.latLng(ll.lat, ll.lng), {
        draggable: true,
        icon: L.divIcon({
          className: 'pt-wrap',
          html: `<div class="edit-vert${isEnd ? ' end' : ''}"></div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        zIndexOffset: 1200,
      });
      marker.on('dragstart', () => {
        workingRef.current = (latestRouteRef.current ?? latlngs).map((p) => ({ ...p }));
      });
      marker.on('drag', (e) => {
        const working = workingRef.current;
        if (!working) return;
        const ll2 = (e.target as L.Marker).getLatLng();
        working[i] = { lat: ll2.lat, lng: ll2.lng };
        setRouteLatLngs([...working]);
        updateMidPositions(working);
      });
      marker.on('dragend', () => {
        workingRef.current = null;
        markEdited();
      });
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
        zIndexOffset: 1100,
      });
      mid.on('click', (e) => {
        L.DomEvent.stop(e);
        insertVertexAt(i + 1);
      });
      mid.addTo(map);
      midMarkersRef.current.push(mid);
    }
  }

  function deleteVertexAt(i: number) {
    const current = latestRouteRef.current;
    if (!current) return;
    if (current.length <= 2) {
      onToast('A line needs at least two vertices.');
      return;
    }
    const latlngs = current.filter((_, idx) => idx !== i);
    setRouteLatLngs(latlngs);
    markEdited();
    buildHandles(latlngs);
  }

  function insertVertexAt(index: number) {
    const current = latestRouteRef.current;
    if (!current) return;
    const a = current[index - 1];
    const b = current[index];
    const vertex: LatLng = { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 };
    const latlngs = [...current.slice(0, index), vertex, ...current.slice(index)];
    setRouteLatLngs(latlngs);
    markEdited();
    buildHandles(latlngs);
  }

  useEffect(() => {
    if (routeLatLngs && routeLatLngs.length) buildHandles(routeLatLngs);
    else clearHandles();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rebuild only when a wholly new route lands (routeVersion), not on every drag-driven update
  }, [routeVersion, mapRef]);

  useEffect(() => () => clearHandles(), []);
}
