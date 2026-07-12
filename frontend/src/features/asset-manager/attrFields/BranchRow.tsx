import { branchCount } from '../../../domain/fiber';
import { LineSelect } from './LineSelect';
import type { FiberBranch, LineFeature } from '../../../domain/types';

interface BranchRowProps {
  branch: FiberBranch;
  maxFiber: number;
  lines: LineFeature[];
  onChange: (branch: FiberBranch) => void;
  onDelete: () => void;
}

function parseRangeValue(raw: string): number | '' {
  return raw === '' ? '' : parseInt(raw, 10);
}

export function BranchRow({ branch, maxFiber, lines, onChange, onDelete }: BranchRowProps) {
  const n = branchCount(branch);
  return (
    <div className="branch-row">
      <LineSelect className="br-line" lines={lines} value={branch.line} onChange={(line) => onChange({ ...branch, line })} />
      <div className="br-range">
        <input
          className="br-from"
          type="number"
          min={1}
          max={maxFiber || 1}
          placeholder="1"
          value={branch.from}
          onChange={(e) => onChange({ ...branch, from: parseRangeValue(e.target.value) })}
        />
        <span className="br-dash">–</span>
        <input
          className="br-to"
          type="number"
          min={1}
          max={maxFiber || 1}
          placeholder={String(maxFiber || '')}
          value={branch.to}
          onChange={(e) => onChange({ ...branch, to: parseRangeValue(e.target.value) })}
        />
        <span className="br-count">{n ? `${n}f` : ''}</span>
      </div>
      <button type="button" className="br-del" title="Remove branch" onClick={onDelete}>
        &times;
      </button>
    </div>
  );
}
