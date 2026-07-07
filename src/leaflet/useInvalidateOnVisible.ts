import { useEffect, useRef, type RefObject } from 'react';
import type L from 'leaflet';

const INVALIDATE_DELAY_MS = 60;

/**
 * Leaflet can't compute its container size while display:none/hidden.
 * Whenever `isVisible` flips false -> true (tab switch back, dashboard
 * closed, login success), invalidateSize() after a short delay so Leaflet
 * picks up the now-visible container's real dimensions.
 */
export function useInvalidateOnVisible(mapRef: RefObject<L.Map | null>, isVisible: boolean): void {
  const wasVisible = useRef(isVisible);

  useEffect(() => {
    if (isVisible && !wasVisible.current) {
      const timer = setTimeout(() => mapRef.current?.invalidateSize(), INVALIDATE_DELAY_MS);
      wasVisible.current = true;
      return () => clearTimeout(timer);
    }
    wasVisible.current = isVisible;
  }, [isVisible, mapRef]);
}
