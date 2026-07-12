import { WIDGET_DEFS } from '../../domain/constants';
import type { Widget } from '../../domain/types';

/** Fast-path UX check for the "already placed" toast; the reducer re-checks against live state before actually adding. */
export function canAddWidget(type: Widget['type'], widgets: Widget[]): boolean {
  return !(WIDGET_DEFS[type].single && widgets.some((w) => w.type === type));
}
