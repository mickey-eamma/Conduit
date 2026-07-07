import type { Feature, UtilId } from './types';

export function isFlowNet(util: UtilId): boolean {
  return util === 'water' || util === 'oilgas';
}

/** Downstream pipe codes at a joint (migrates the legacy single toLine). */
export function downOf(join: Feature): string[] {
  const toLines = join.props.toLines ?? (join.props.toLine ? [join.props.toLine] : []);
  return toLines.filter(Boolean);
}

/** Forward graph: pipe code -> the pipe codes it feeds into. */
export function flowAdjacency(features: Feature[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const j of features) {
    if (j.type !== 'join' || !j.props.fromLine) continue;
    for (const to of downOf(j)) {
      if (!adj.has(j.props.fromLine)) adj.set(j.props.fromLine, []);
      adj.get(j.props.fromLine)!.push(to);
    }
  }
  return adj;
}

/** Reverse graph: pipe code -> every pipe feeding INTO it. */
export function upstreamAdjacency(features: Feature[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  for (const j of features) {
    if (j.type !== 'join' || !j.props.fromLine) continue;
    for (const to of downOf(j)) {
      if (!adj.has(to)) adj.set(to, []);
      adj.get(to)!.push(j.props.fromLine);
    }
  }
  return adj;
}

/** Walks the flow graph from startCode grouped by hop distance (BFS levels). 'up' walks against the flow direction. */
export function flowLevels(features: Feature[], startCode: string, dir: 'up' | 'down'): string[][] {
  const adj = dir === 'up' ? upstreamAdjacency(features) : flowAdjacency(features);
  const levels: string[][] = [[startCode]];
  const seen = new Set([startCode]);
  let frontier = [startCode];
  while (frontier.length) {
    const next: string[] = [];
    for (const cur of frontier) {
      for (const n of adj.get(cur) ?? []) {
        if (!seen.has(n)) {
          seen.add(n);
          next.push(n);
        }
      }
    }
    if (next.length) levels.push(next);
    frontier = next;
  }
  return levels;
}
