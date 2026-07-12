import { useRef, type RefObject } from 'react';

/**
 * Mirrors the original's widget reposition drag: mutates the DOM `left`/`top`
 * directly on every pointermove for smooth 60fps dragging, and only commits
 * the final position back to state on pointerup (avoids a reducer dispatch
 * per frame during a drag).
 */
export function useWidgetDragReposition(
  widgetLayerRef: RefObject<HTMLDivElement | null>,
  elRef: RefObject<HTMLDivElement | null>,
  getPosition: () => { x: number; y: number },
  onMoveEnd: (x: number, y: number) => void,
): (e: React.PointerEvent) => void {
  const draggingRef = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    e.preventDefault();
    const layer = widgetLayerRef.current;
    const el = elRef.current;
    if (!layer || !el) return;
    const r = layer.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const { x: ox, y: oy } = getPosition();
    let x = ox;
    let y = oy;
    el.classList.add('dragging');
    draggingRef.current = true;

    function mv(ev: PointerEvent) {
      x = Math.min(0.97, Math.max(0, ox + (ev.clientX - sx) / r.width));
      y = Math.min(0.96, Math.max(0, oy + (ev.clientY - sy) / r.height));
      if (el) {
        el.style.left = `${x * 100}%`;
        el.style.top = `${y * 100}%`;
      }
    }
    function up() {
      document.removeEventListener('pointermove', mv);
      document.removeEventListener('pointerup', up);
      el?.classList.remove('dragging');
      draggingRef.current = false;
      onMoveEnd(x, y);
    }
    document.addEventListener('pointermove', mv);
    document.addEventListener('pointerup', up);
  }

  return onPointerDown;
}
