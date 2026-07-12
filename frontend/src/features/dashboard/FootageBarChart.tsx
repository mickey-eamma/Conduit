import { ORDER, UTILS } from '../../domain/constants';
import type { NetStats } from '../../domain/networkStats';
import type { UtilId } from '../../domain/types';
import { nf } from './formatNumber';

interface FootageBarChartProps {
  stats: Record<UtilId, NetStats>;
  maxFeet: number;
}

export function FootageBarChart({ stats, maxFeet }: FootageBarChartProps) {
  return (
    <div className="dash-card">
      <h4>Footage by network</h4>
      {ORDER.map((id) => {
        const u = UTILS[id];
        const s = stats[id];
        const w = (s.feet / maxFeet) * 100 || 0;
        return (
          <div className="bar-row" key={id}>
            <span className="bar-lab">
              <span className="dot" style={{ background: u.color }} />
              {u.label}
            </span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${w}%`, background: u.color }} />
            </span>
            <span className="bar-val">
              {nf(s.feet)} ft <em>{s.miles.toFixed(2)} mi</em>
            </span>
          </div>
        );
      })}
    </div>
  );
}
