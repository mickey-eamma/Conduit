import type { TelecomFiberStats } from '../../domain/networkStats';
import { nf } from './formatNumber';

interface FiberKpiCardProps {
  fiber: TelecomFiberStats;
}

export function FiberKpiCard({ fiber }: FiberKpiCardProps) {
  return (
    <div className="dash-card fiber-card">
      <h4>Telecom fiber</h4>
      <div className="fiber-kpis">
        <div>
          <b>{fiber.cables}</b>
          <span>cables</span>
        </div>
        <div>
          <b>{nf(fiber.strandFt)}</b>
          <span>strand-ft</span>
        </div>
        <div>
          <b>{fiber.strandMi.toFixed(1)}</b>
          <span>strand-mi</span>
        </div>
        <div>
          <b>{fiber.splices}</b>
          <span>splice points</span>
        </div>
        <div>
          <b>{fiber.spliced}</b>
          <span>spliced strands</span>
        </div>
        <div>
          <b>{fiber.risers}</b>
          <span>risers</span>
        </div>
      </div>
    </div>
  );
}
