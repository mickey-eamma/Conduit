import { exportGeoJSON } from '../../lib/geojsonExport';
import type { NetworkState } from '../../state/network/networkTypes';
import { FiberKpiCard } from './FiberKpiCard';
import { FootageBarChart } from './FootageBarChart';
import { KpiTiles } from './KpiTiles';
import { NetworkCardsGrid } from './NetworkCardsGrid';
import { StatusBarChart } from './StatusBarChart';
import { useDashboardMetrics } from './useDashboardMetrics';

interface DashboardPageProps {
  network: NetworkState;
}

/** The `.dash` full-screen overlay shown when Asset Manager's view-tabs are set to "Dashboard". */
export function DashboardPage({ network }: DashboardPageProps) {
  const metrics = useDashboardMetrics(network);

  return (
    <div className="dash" id="dash">
      <div className="dash-inner">
        <div className="dash-head">
          <div>
            <div className="dash-title">Network dashboard</div>
            <div className="dash-sub">Live metrics across all four utilities</div>
          </div>
          <button className="btn primary" id="dashExport" onClick={() => exportGeoJSON(network)}>
            Export GeoJSON
          </button>
        </div>
        <KpiTiles totFeet={metrics.totFeet} totLines={metrics.totLines} totFeat={metrics.totFeat} totDeliv={metrics.totDeliv} />
        <div className="dash-row">
          <FootageBarChart stats={metrics.stats} maxFeet={metrics.maxFeet} />
          <StatusBarChart statusTot={metrics.statusTot} statusMax={metrics.statusMax} />
        </div>
        <NetworkCardsGrid stats={metrics.stats} />
        <FiberKpiCard fiber={metrics.fiber} />
      </div>
    </div>
  );
}
