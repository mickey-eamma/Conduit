import { ORDER, UTILS } from '../../domain/constants';
import type { CxLine } from './cxAllLines';

interface LineChecklistProps {
  allLines: CxLine[];
  selected: Set<string>;
  onToggle: (code: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
}

export function LineChecklist({ allLines, selected, onToggle, onSelectAll, onSelectNone }: LineChecklistProps) {
  const n = selected.size;

  return (
    <section>
      <h3>
        Your lines <span className="cd">{n ? `${n} selected` : ''}</span>
      </h3>
      <div className="cx-selbar">
        <button onClick={onSelectAll}>Select all</button>
        <button onClick={onSelectNone}>Clear</button>
      </div>
      <div id="cxLineList">
        {allLines.length === 0 ? (
          <p className="cx-empty">No lines in this client yet — draw some in Asset Manager first.</p>
        ) : (
          ORDER.map((id) => {
            const lines = allLines.filter((l) => l.util === id);
            if (!lines.length) return null;
            return (
              <div key={id}>
                <div className="cx-net">{UTILS[id].label}</div>
                {lines.map((l) => (
                  <label className="cx-lrow" key={l.code}>
                    <input type="checkbox" checked={selected.has(l.code)} onChange={() => onToggle(l.code)} />
                    <span className="lc" style={{ background: UTILS[id].color }} />
                    <span className="nm">{l.name}</span>
                    <span className="cd">{l.code}</span>
                  </label>
                ))}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
