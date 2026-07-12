import type { RefObject } from 'react';
import type { Widget } from '../../domain/types';
import { WidgetPalette } from './WidgetPalette';

interface BuilderWidgetsTabProps {
  widgets: Widget[];
  widgetLayerRef: RefObject<HTMLDivElement | null>;
  onAdd: (type: Widget['type'], x: number | null, y: number | null) => void;
}

export function BuilderWidgetsTab({ widgets, widgetLayerRef, onAdd }: BuilderWidgetsTabProps) {
  return (
    <div className="bs-page" id="bsWidgets">
      <p className="note" style={{ margin: '0 0 12px' }}>
        Drag a widget onto the canvas to place it, or click one to drop it in the corner. Hover a placed widget and move it by its handle.
      </p>
      <WidgetPalette widgets={widgets} widgetLayerRef={widgetLayerRef} onAdd={onAdd} />
      <section className="bs-foot">
        <h3>Publish</h3>
        <p className="note">
          Deploy captures the canvas exactly — framing, layer symbology, pop-up settings, and widgets — as a read-only map app in a new
          tab.
        </p>
      </section>
    </div>
  );
}
