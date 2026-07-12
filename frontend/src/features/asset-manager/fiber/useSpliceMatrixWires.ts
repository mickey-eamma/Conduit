import { useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { UTILS } from '../../../domain/constants';
import type { FiberSplice } from '../../../domain/types';

interface FibNodeInfo {
  side: 'in' | 'out';
  line: string | null;
  fiber: number;
}

interface Armed extends FibNodeInfo {
  el: HTMLElement;
}

interface WirePath {
  index: number;
  d: string;
}

export interface UseSpliceMatrixWiresResult {
  registerNode: (side: 'in' | 'out', line: string | null, fiber: number) => (el: HTMLDivElement | null) => void;
  onNodePointerDown: (info: FibNodeInfo) => (e: ReactPointerEvent<HTMLDivElement>) => void;
  armedKey: string | null;
  wires: WirePath[];
  tempWireD: string;
  svgSize: { width: number; height: number };
  stageRef: (el: HTMLDivElement | null) => void;
  scrollContainerRef: (el: HTMLDivElement | null) => void;
}

function wirePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
}

function keyOf(info: FibNodeInfo): string {
  return `${info.side}:${info.line ?? ''}:${info.fiber}`;
}

/**
 * Owns the splice matrix's DOM-measurement-driven SVG wire drawing and the
 * press/drag-to-connect gesture. Recomputes wire paths via useLayoutEffect
 * (avoids a visible flash) whenever splices change or the stage
 * resizes/scrolls — the direct-DOM-measurement equivalent of the original's
 * getBoundingClientRect-based drawWires().
 */
export function useSpliceMatrixWires(
  splices: FiberSplice[],
  onConnect: (inFiber: number, outLine: string, outFiber: number) => void,
): UseSpliceMatrixWiresResult {
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const stageElRef = useRef<HTMLDivElement | null>(null);
  const scrollElRef = useRef<HTMLDivElement | null>(null);
  const armedRef = useRef<Armed | null>(null);
  const dragRef = useRef<{ start: { x: number; y: number }; moved: boolean } | null>(null);

  const [armedKey, setArmedKey] = useState<string | null>(null);
  const [wires, setWires] = useState<WirePath[]>([]);
  const [tempWireD, setTempWireD] = useState('');
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  function recompute() {
    const stage = stageElRef.current;
    if (!stage) return;

    // Guard against a ResizeObserver <-> setState feedback loop: only commit
    // a state update when the computed value actually changed. Without this,
    // observing `stage` while also sizing the SVG overlay from state can spin
    // forever (each render nudges layout, which re-fires the observer).
    setSvgSize((prev) =>
      prev.width === stage.scrollWidth && prev.height === stage.scrollHeight
        ? prev
        : { width: stage.scrollWidth, height: stage.scrollHeight },
    );

    const stageRect = stage.getBoundingClientRect();
    const rel = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { left: r.left - stageRect.left, right: r.right - stageRect.left, top: r.top - stageRect.top, h: r.height };
    };

    const next: WirePath[] = [];
    splices.forEach((c, i) => {
      const ln = nodesRef.current.get(keyOf({ side: 'in', line: null, fiber: c.inFiber }));
      const rn = nodesRef.current.get(keyOf({ side: 'out', line: c.outLine, fiber: c.outFiber }));
      if (!ln || !rn) return;
      const a = rel(ln);
      const b = rel(rn);
      next.push({ index: i, d: wirePath(a.right, a.top + a.h / 2, b.left, b.top + b.h / 2) });
    });
    setWires((prev) => {
      if (prev.length === next.length && prev.every((w, i) => w.d === next[i].d && w.index === next[i].index)) return prev;
      return next;
    });
  }

  useLayoutEffect(() => {
    recompute();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recompute closes over refs + current splices
  }, [splices]);

  useLayoutEffect(() => {
    const stage = stageElRef.current;
    const scrollEl = scrollElRef.current;
    if (!stage) return;
    const ro = new ResizeObserver(recompute);
    ro.observe(stage);
    scrollEl?.addEventListener('scroll', recompute);
    return () => {
      ro.disconnect();
      scrollEl?.removeEventListener('scroll', recompute);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- attach once refs settle
  }, []);

  function registerNode(side: 'in' | 'out', line: string | null, fiber: number) {
    const key = keyOf({ side, line, fiber });
    return (el: HTMLDivElement | null) => {
      if (el) nodesRef.current.set(key, el);
      else nodesRef.current.delete(key);
    };
  }

  function handleClick(info: FibNodeInfo, el: HTMLElement) {
    const armed = armedRef.current;
    if (armed && keyOf(armed) === keyOf(info)) {
      armedRef.current = null;
      setArmedKey(null);
      return;
    }
    if (armed && armed.side !== info.side) {
      const inInfo = armed.side === 'in' ? armed : info;
      const outInfo = armed.side === 'in' ? info : armed;
      if (outInfo.line) onConnect(inInfo.fiber, outInfo.line, outInfo.fiber);
      armedRef.current = null;
      setArmedKey(null);
      return;
    }
    armedRef.current = { ...info, el };
    setArmedKey(keyOf(info));
  }

  function drawTemp(node: HTMLElement, clientX: number, clientY: number, side: 'in' | 'out') {
    const stage = stageElRef.current;
    if (!stage) return;
    const stageRect = stage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    const sx = side === 'in' ? r.right - stageRect.left : r.left - stageRect.left;
    const sy = r.top - stageRect.top + r.height / 2;
    setTempWireD(wirePath(sx, sy, clientX - stageRect.left, clientY - stageRect.top));
  }

  function onNodePointerDown(info: FibNodeInfo) {
    return (e: ReactPointerEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      e.preventDefault();
      handleClick(info, el);
      dragRef.current = { start: { x: e.clientX, y: e.clientY }, moved: false };

      function onMove(ev: PointerEvent) {
        const d = dragRef.current;
        if (!d) return;
        if (!d.moved && Math.abs(ev.clientX - d.start.x) + Math.abs(ev.clientY - d.start.y) > 5) d.moved = true;
        if (d.moved && armedRef.current) {
          ev.preventDefault();
          drawTemp(armedRef.current.el, ev.clientX, ev.clientY, armedRef.current.side);
        }
      }
      function onUp(ev: PointerEvent) {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        const d = dragRef.current;
        dragRef.current = null;
        setTempWireD('');
        if (!d?.moved) return;
        const tgt = document.elementFromPoint(ev.clientX, ev.clientY);
        const nodeEl = tgt?.closest<HTMLElement>('.fib');
        if (nodeEl && nodeEl !== el) {
          const side = nodeEl.dataset.side as 'in' | 'out';
          const line = nodeEl.dataset.line ?? null;
          const fiber = Number(nodeEl.dataset.fiber);
          handleClick({ side, line, fiber }, nodeEl);
        }
      }
      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    };
  }

  return {
    registerNode,
    onNodePointerDown,
    armedKey,
    wires,
    tempWireD,
    svgSize,
    stageRef: (el) => {
      stageElRef.current = el;
    },
    scrollContainerRef: (el) => {
      scrollElRef.current = el;
    },
  };
}

export const TEMP_WIRE_COLOR = UTILS.telecom.color;
