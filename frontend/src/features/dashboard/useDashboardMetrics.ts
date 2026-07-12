import { useMemo } from 'react';
import { ORDER, STATUSES } from '../../domain/constants';
import { computeRisers } from '../../domain/risers';
import { netStats, telecomFiberStats, type NetStats, type TelecomFiberStats } from '../../domain/networkStats';
import type { StatusName, UtilId, LineFeature } from '../../domain/types';
import type { NetworkState } from '../../state/network/networkTypes';

export interface DashboardMetrics {
  stats: Record<UtilId, NetStats>;
  totFeet: number;
  totFeat: number;
  totLines: number;
  totDeliv: number;
  maxFeet: number;
  statusTot: Record<StatusName, number>;
  statusMax: number;
  fiber: TelecomFiberStats;
}

/** Mirrors the original's per-render stat rollup at the top of `renderDashboard`. */
export function useDashboardMetrics(network: NetworkState): DashboardMetrics {
  return useMemo(() => {
    const stats = {} as Record<UtilId, NetStats>;
    for (const id of ORDER) stats[id] = netStats(network, id);

    const totFeet = ORDER.reduce((sum, id) => sum + stats[id].feet, 0);
    const totFeat = ORDER.reduce((sum, id) => sum + stats[id].total, 0);
    const totLines = ORDER.reduce((sum, id) => sum + stats[id].cnt.line, 0);
    const totDeliv = ORDER.reduce((sum, id) => sum + stats[id].cnt.delivery, 0);
    const maxFeet = Math.max(1, ...ORDER.map((id) => stats[id].feet));

    const statusTot = { Active: 0, Construction: 0, Planned: 0, Abandoned: 0 } as Record<StatusName, number>;
    for (const id of ORDER) for (const s of STATUSES) statusTot[s] += stats[id].byStatus[s];
    const statusMax = Math.max(1, ...STATUSES.map((s) => statusTot[s]));

    const telecomLines = network.networks.telecom.features.filter((f): f is LineFeature => f.type === 'line');
    const fiber = telecomFiberStats(network, computeRisers(telecomLines).length);

    return { stats, totFeet, totFeat, totLines, totDeliv, maxFeet, statusTot, statusMax, fiber };
  }, [network]);
}
