import { UTILS } from '../../domain/constants';
import type { ToolId, UtilId } from '../../domain/types';

export function hintText(tool: ToolId, util: UtilId): string {
  const term = (r: 'line' | 'source' | 'join' | 'delivery') => UTILS[util].terms[r];
  const msg: Record<ToolId, string> = {
    pan: 'Click any feature to select it and edit its details. Drag to pan.',
    line: `Click to lay vertices of a ${term('line').toLowerCase()}. Double-click or Enter to finish · Esc to cancel.`,
    source: `Click the map to place a ${term('source').toLowerCase()} — where the commodity originates.`,
    join: `Click to drop a ${term('join').toLowerCase()}, then pick the two lines it connects.`,
    delivery: `Click to place a ${term('delivery').toLowerCase()} — where service is delivered.`,
    delete: 'Click any feature on the map to remove it.',
  };
  return msg[tool];
}

export function toolStatusLabel(tool: ToolId, util: UtilId): string {
  if (tool === 'pan') return 'Select';
  if (tool === 'delete') return 'Delete';
  const role = (['line', 'source', 'join', 'delivery'] as const).find((r) => r === tool);
  if (!role) return tool;
  const label = tool === 'line' ? 'Draw' : 'Place';
  return `${label} ${UTILS[util].terms[role].split(' / ')[0].toLowerCase()}`;
}

export function cursorForTool(tool: ToolId): 'draw' | 'delete' | 'pan' {
  if (tool === 'line' || tool === 'source' || tool === 'join' || tool === 'delivery') return 'draw';
  if (tool === 'delete') return 'delete';
  return 'pan';
}
