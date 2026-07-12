import { nf } from './formatNumber';

interface KpiTilesProps {
  totFeet: number;
  totLines: number;
  totFeat: number;
  totDeliv: number;
}

export function KpiTiles({ totFeet, totLines, totFeat, totDeliv }: KpiTilesProps) {
  return (
    <div className="dash-kpis">
      <div className="kpi">
        <div className="kpi-v">
          {(totFeet / 5280).toFixed(2)}
          <span>mi</span>
        </div>
        <div className="kpi-l">Total footage</div>
        <div className="kpi-s">{nf(totFeet)} ft</div>
      </div>
      <div className="kpi">
        <div className="kpi-v">
          {nf(totFeet)}
          <span>ft</span>
        </div>
        <div className="kpi-l">Linear feet</div>
        <div className="kpi-s">across {totLines} lines</div>
      </div>
      <div className="kpi">
        <div className="kpi-v">{totFeat}</div>
        <div className="kpi-l">Total features</div>
        <div className="kpi-s">all networks</div>
      </div>
      <div className="kpi">
        <div className="kpi-v">{totDeliv}</div>
        <div className="kpi-l">Delivery points</div>
        <div className="kpi-s">service endpoints</div>
      </div>
    </div>
  );
}
