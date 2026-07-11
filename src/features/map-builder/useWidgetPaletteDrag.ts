import { useRef, type RefObject } from 'react';

/**
 * Mirrors the original's `paletteDrag`: a plain click (no movement past the
 * 4px threshold) drops the widget at an auto-placed default position; a real
 * drag shows a floating ghost label and only commits if released over the
 * widget layer.
 */
export function useWidgetPaletteDrag(
  widgetLayerRef: RefObject<HTMLDivElement | null>,
): (e: React.PointerEvent, label: string, commit: (x: number | null, y: number | null) => void) => void {
  const ghostRef = useRef<HTMLDivElement | null>(null);

  function startDrag(e: React.PointerEvent, label: string, commit: (x: number | null, y: number | null) => void) {
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    let moved = false;

    function mv(ev: PointerEvent) {
      const layer = widgetLayerRef.current;
      if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 4) {
        moved = true;
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = label;
        document.body.appendChild(ghost);
        ghostRef.current = ghost;
      }
      const ghost = ghostRef.current;
      if (ghost && layer) {
        ghost.style.left = `${ev.clientX}px`;
        ghost.style.top = `${ev.clientY}px`;
        const r = layer.getBoundingClientRect();
        const ok = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        ghost.classList.toggle('ok', ok);
      }
    }

    function up(ev: PointerEvent) {
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
      ghostRef.current?.remove();
      ghostRef.current = null;
      const layer = widgetLayerRef.current;
      if (moved) {
        if (layer) {
          const r = layer.getBoundingClientRect();
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) {
            commit((ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
          }
        }
      } else {
        commit(null, null);
      }
    }

    document.addEventListener('pointermove', mv);
    document.addEventListener('pointerup', up);
  }

  return startDrag;
}
