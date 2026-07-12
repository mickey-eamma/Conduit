import { STATUSES, STATUS_COLOR } from '../../domain/constants';
import type { StatusName } from '../../domain/types';

interface StatusBarChartProps {
  statusTot: Record<StatusName, number>;
  statusMax: number;
}

export function StatusBarChart({ statusTot, statusMax }: StatusBarChartProps) {
  return (
    <div className="dash-card">
      <h4>Features by status</h4>
      {STATUSES.map((s) => {
        const w = (statusTot[s] / statusMax) * 100 || 0;
        return (
          <div className="bar-row" key={s}>
            <span className="bar-lab">
              <span className="dot" style={{ background: STATUS_COLOR[s] }} />
              {s}
            </span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${w}%`, background: STATUS_COLOR[s] }} />
            </span>
            <span className="bar-val">{statusTot[s]}</span>
          </div>
        );
      })}
    </div>
  );
}
