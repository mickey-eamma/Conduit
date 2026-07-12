import { useRef, useState } from 'react';
import type { LatLng } from '../../domain/types';
import { fetchOsrmRoute } from './osrmRoute';

export interface UseNetworkDesignRoutingResult {
  waypoints: LatLng[];
  routeLatLngs: LatLng[] | null;
  /** Bumped only when a wholly new route replaces the array (fetch landed, undo, clear) — NOT on per-vertex edits. Drives handle rebuilds. */
  routeVersion: number;
  routing: boolean;
  routed: boolean;
  addWaypoint: (ll: LatLng) => void;
  undo: () => void;
  clear: () => void;
  setRouteLatLngs: (latlngs: LatLng[]) => void;
  markEdited: () => void;
}

/** Waypoint list + OSRM routing state — mirrors the original's `netdesign` object (waypoints/routeLatLngs/routing/routed). */
export function useNetworkDesignRouting(onToast: (message: string) => void): UseNetworkDesignRoutingResult {
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [routeLatLngs, setRouteLatLngs] = useState<LatLng[] | null>(null);
  const [routeVersion, setRouteVersion] = useState(0);
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState(false);
  // Guards against a stale response landing after waypoints changed again (e.g. rapid undo/click).
  const requestIdRef = useRef(0);

  async function route(points: LatLng[]) {
    const reqId = ++requestIdRef.current;
    setRouting(true);
    try {
      const ll = await fetchOsrmRoute(points);
      if (requestIdRef.current !== reqId) return;
      setRouteLatLngs(ll);
      setRouteVersion((v) => v + 1);
      setRouted(true);
    } catch {
      if (requestIdRef.current !== reqId) return;
      setRouteLatLngs(points.map((ll) => ({ ...ll })));
      setRouteVersion((v) => v + 1);
      setRouted(false);
      onToast('Routing unavailable — drew straight segments; drag vertices to trace the streets.');
    } finally {
      if (requestIdRef.current === reqId) setRouting(false);
    }
  }

  function addWaypoint(ll: LatLng) {
    if (routing) return;
    const next = [...waypoints, ll];
    setWaypoints(next);
    if (next.length >= 2) route(next);
  }

  function undo() {
    if (!waypoints.length) return;
    const next = waypoints.slice(0, -1);
    setWaypoints(next);
    if (next.length >= 2) route(next);
    else {
      requestIdRef.current++;
      setRouteLatLngs(null);
      setRouteVersion((v) => v + 1);
      setRouted(false);
    }
  }

  function clear() {
    requestIdRef.current++;
    setWaypoints([]);
    setRouteLatLngs(null);
    setRouteVersion((v) => v + 1);
    setRouted(false);
    setRouting(false);
  }

  function markEdited() {
    setRouted(false);
  }

  return { waypoints, routeLatLngs, routeVersion, routing, routed, addWaypoint, undo, clear, setRouteLatLngs, markEdited };
}
