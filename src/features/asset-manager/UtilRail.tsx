import { GLYPH, UTILS } from '../../domain/constants';
import { ORDER } from '../../domain/constants';
import type { UtilId } from '../../domain/types';

interface UtilRailProps {
  active: UtilId;
  counts: Record<UtilId, number>;
  onSelect: (id: UtilId) => void;
}

export function UtilRail({ active, counts, onSelect }: UtilRailProps) {
  return (
    <nav className="util-rail">
      <div className="rail-label">Network</div>
      {ORDER.map((id) => {
        const u = UTILS[id];
        return (
          <div
            key={id}
            className={`util-tab${id === active ? ' active' : ''}`}
            style={{ ['--u' as string]: u.color }}
            onClick={() => onSelect(id)}
          >
            <div className="glyph" dangerouslySetInnerHTML={{ __html: GLYPH[id] }} />
            <div className="nm">{u.label}</div>
            <div className="ct">{counts[id]}</div>
          </div>
        );
      })}
    </nav>
  );
}
