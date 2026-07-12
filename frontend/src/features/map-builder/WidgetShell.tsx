import { useRef, type ReactNode, type RefObject } from 'react';
import type { Widget } from '../../domain/types';
import { useWidgetDragReposition } from './useWidgetDragReposition';

interface WidgetShellProps {
  widget: Widget;
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  onMove: (id: string, x: number, y: number) => void;
  onRemove: (id: string) => void;
  extraButtons?: ReactNode;
  children: ReactNode;
}

/** Common chrome (drag handle + remove button) shared by all 7 widget types, matching the original's `.widget`/`.w-tools` markup. */
export function WidgetShell({ widget, widgetLayerRef, onMove, onRemove, extraButtons, children }: WidgetShellProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef(widget);
  widgetRef.current = widget;
  const onPointerDown = useWidgetDragReposition(
    widgetLayerRef,
    elRef,
    () => ({ x: widgetRef.current.x, y: widgetRef.current.y }),
    (x, y) => onMove(widget.id, x, y),
  );

  return (
    <div ref={elRef} className="widget" style={{ left: `${widget.x * 100}%`, top: `${widget.y * 100}%` }}>
      <div className="w-tools" onPointerDown={onPointerDown}>
        <span className="grip">⠿ drag</span>
        {extraButtons}
        <button title="Remove widget" onClick={() => onRemove(widget.id)}>
          ✕
        </button>
      </div>
      {children}
    </div>
  );
}
