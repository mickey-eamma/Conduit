import { useEffect, useRef, type RefObject } from 'react';
import L from 'leaflet';

/**
 * Creates a Leaflet map bound to `containerRef` once per mount and tears it
 * down on unmount. The map instance itself never enters React state — it's a
 * ref, and downstream code (layerRefRegistry, event handlers) reads/writes it
 * imperatively.
 *
 * Guards against React StrictMode's dev-mode double-invoke: Leaflet's own
 * `map.remove()` clears `container._leaflet_id`, so a properly-run cleanup
 * already makes mount->unmount->remount safe; the `_leaflet_id` check here is
 * an extra defensive guard against any edge case where cleanup didn't run
 * before a second mount (e.g. fast refresh).
 */
export function useLeafletMap(
  containerRef: RefObject<HTMLDivElement | null>,
  options?: L.MapOptions,
): RefObject<L.Map | null> {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;
    if ((container as unknown as { _leaflet_id?: number })._leaflet_id) return;

    const map = L.map(container, options);
    mapRef.current = map;

    // Leaflet only measures its container at construction time (or when
    // invalidateSize() is called explicitly). Since sibling UI can still
    // shift the container's size after this point (e.g. a panel mounting
    // later in the same layout pass), keep it honest with a ResizeObserver.
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- map is created once per mount; options is intentionally not a dependency
  }, [containerRef]);

  return mapRef;
}
