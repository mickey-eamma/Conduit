import { toolsFor, TOOLS, UTILS } from '../../domain/constants';
import type { ToolId, UtilId } from '../../domain/types';

interface ToolbarProps {
  active: ToolId;
  currentUtil: UtilId;
  onSelect: (tool: ToolId) => void;
}

function isSepBefore(t: ToolId, util: UtilId): boolean {
  if (util === 'land') return t === 'site' || t === 'delete';
  if (util === 'parcel') return t === 'parcel' || t === 'delete';
  return t === 'source' || t === 'delete';
}

export function Toolbar({ active, currentUtil, onSelect }: ToolbarProps) {
  return (
    <div className="toolbar">
      {toolsFor(currentUtil).map((t) => (
        <span key={t} style={{ display: 'contents' }}>
          {isSepBefore(t, currentUtil) && <div className="tool-sep" />}
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
