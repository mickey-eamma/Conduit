import { TOOLS, UTILS } from '../../domain/constants';
import type { ToolId, UtilId } from '../../domain/types';

interface ToolbarProps {
  active: ToolId;
  currentUtil: UtilId;
  onSelect: (tool: ToolId) => void;
}

const TOOL_ORDER: ToolId[] = ['pan', 'line', 'source', 'join', 'delivery', 'delete'];

export function Toolbar({ active, currentUtil, onSelect }: ToolbarProps) {
  return (
    <div className="toolbar">
      {TOOL_ORDER.map((t) => (
        <span key={t} style={{ display: 'contents' }}>
          {(t === 'source' || t === 'delete') && <div className="tool-sep" />}
          <button
            type="button"
            className={`tool${t === active ? ' active' : ''}`}
            onClick={() => onSelect(t)}
          >
            <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: TOOLS[t].icon }} />
            <span className="tip">
              {TOOLS[t].role ? (
                <>
                  {TOOLS[t].label} <b>{UTILS[currentUtil].terms[TOOLS[t].role]}</b>
                </>
              ) : (
                TOOLS[t].label
              )}
            </span>
          </button>
        </span>
      ))}
    </div>
  );
}
