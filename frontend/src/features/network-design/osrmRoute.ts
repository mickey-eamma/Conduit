import type { LatLng } from '../../domain/types';

const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving/';

/** Routes through `waypoints` along the OSM street network. Throws if OSRM has no route — caller falls back to straight segments. */
export async function fetchOsrmRoute(waypoints: LatLng[]): Promise<LatLng[]> {
  const coords = waypoints.map((ll) => `${ll.lng},${ll.lat}`).join(';');
  const res = await fetch(`${OSRM_URL}${coords}?overview=simplified&geometries=geojson`);
  const json = await res.json();
  if (json.code !== 'Ok' || !json.routes || !json.routes.length) {
    throw new Error(json.message || 'No route found between those points.');
  }
  return (json.routes[0].geometry.coordinates as [number, number][]).map(([lng, lat]) => ({ lat, lng }));
}
