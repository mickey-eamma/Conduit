import type { RefObject } from 'react';
import { WIDGET_DEFS } from '../../domain/constants';
import type { Widget } from '../../domain/types';
import { useWidgetPaletteDrag } from './useWidgetPaletteDrag';

type WidgetType = Widget['type'];

interface WidgetPaletteProps {
  widgets: Widget[];
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  onAdd: (type: WidgetType, x: number | null, y: number | null) => void;
}

/** Experience Builder-style drag-from-palette widget picker. */
export function WidgetPalette({ widgets, widgetLayerRef, onAdd }: WidgetPaletteProps) {
  const startDrag = useWidgetPaletteDrag(widgetLayerRef);

  return (
    <div id="widgetPalette">
      {(Object.keys(WIDGET_DEFS) as WidgetType[]).map((type) => {
        const def = WIDGET_DEFS[type];
        const placed = def.single && widgets.some((w) => w.type === type);
        return (
          <div
            key={type}
            className={`pw${placed ? ' placed' : ''}`}
            onPointerDown={(e) => startDrag(e, def.label, (x, y) => onAdd(type, x, y))}
          >
            <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: def.icon }} />
            <span className="pwn">{def.label}</span>
            <span className="pwd">{def.desc}</span>
          </div>
        );
      })}
    </div>
  );
}
