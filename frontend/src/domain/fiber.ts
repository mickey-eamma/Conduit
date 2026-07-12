import type { Feature, FiberSplice, LineFeature, PointFeature } from './types';

function asNumber(v: number | ''): number {
  return v === '' ? NaN : v;
}

export interface BranchAssignment {
  splice: PointFeature;
  from: number;
  to: number;
  count: number;
}

/** Is this telecom line a branch off some splice? If so its strand count is assigned there, not stored on itself. */
export function branchAssignmentFor(lineFeat: Feature, telecomFeatures: Feature[]): BranchAssignment | null {
  if (lineFeat.util !== 'telecom') return null;
  for (const j of telecomFeatures) {
    if (j.type !== 'join') continue;
    for (const b of j.props.branches ?? []) {
      if (b.line === lineFeat.code) {
        const from = asNumber(b.from);
        const to = asNumber(b.to);
        if (!Number.isNaN(from) && !Number.isNaN(to) && to >= from) {
          return { splice: j, from, to, count: to - from + 1 };
        }
      }
    }
  }
  return null;
}

/** A cable's true fiber count: assigned by an upstream splice if it's a branch, else its own stored value. */
export function effectiveFiberCount(lineFeat: Feature, telecomFeatures: Feature[]): number {
  const a = branchAssignmentFor(lineFeat, telecomFeatures);
  return a ? a.count : lineFeat.props.fiberCount || 0;
}

export function parentFiberCount(joinFeat: Feature, telecomFeatures: Feature[]): number {
  const parent = telecomFeatures.find(
    (f): f is LineFeature => f.type === 'line' && f.code === joinFeat.props.parentLine,
  );
  return parent ? effectiveFiberCount(parent, telecomFeatures) : 0;
}

export interface BranchStats {
  X: number;
  allocated: number;
  remaining: number;
  overlaps: boolean;
  outOfRange: boolean;
}

export function branchStats(joinFeat: Feature, telecomFeatures: Feature[]): BranchStats {
  const X = parentFiberCount(joinFeat, telecomFeatures);
  const used: Record<number, boolean> = {};
  let overlaps = false;
  let outOfRange = false;
  for (const b of joinFeat.props.branches ?? []) {
    if (!b.line) continue;
    const from = asNumber(b.from);
    const to = asNumber(b.to);
    if (Number.isNaN(from) || Number.isNaN(to)) continue;
    if (from < 1 || to > X || from > to) {
      outOfRange = true;
      continue;
    }
    for (let i = from; i <= to; i++) {
      if (used[i]) overlaps = true;
      used[i] = true;
    }
  }
  const allocated = Object.keys(used).length;
  return { X, allocated, remaining: Math.max(0, X - allocated), overlaps, outOfRange };
}

export function branchCount(b: { from: number | ''; to: number | '' }): number {
  const from = asNumber(b.from);
  const to = asNumber(b.to);
  return !Number.isNaN(from) && !Number.isNaN(to) && to >= from ? to - from + 1 : 0;
}

function lineByCode(telecomFeatures: Feature[], code: string): LineFeature | undefined {
  return telecomFeatures.find((f): f is LineFeature => f.type === 'line' && f.code === code);
}

export interface ValidBranch {
  line: string;
  from: number;
  to: number;
  count: number;
}

/** Branches with a real line + a sane numeric from/to range, parsed to plain numbers. */
export function validBranches(joinFeat: Feature, telecomFeatures: Feature[]): ValidBranch[] {
  const result: ValidBranch[] = [];
  for (const b of joinFeat.props.branches ?? []) {
    if (!b.line || !lineByCode(telecomFeatures, b.line)) continue;
    const from = asNumber(b.from);
    const to = asNumber(b.to);
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) continue;
    result.push({ line: b.line, from, to, count: to - from + 1 });
  }
  return result;
}

/** Drops any splice referencing a strand outside the current valid range (mirrors "drop stale refs"). */
export function pruneSplices(joinFeat: Feature, telecomFeatures: Feature[]): FiberSplice[] {
  const X = parentFiberCount(joinFeat, telecomFeatures);
  const branches = validBranches(joinFeat, telecomFeatures);
  return (joinFeat.props.splices ?? []).filter((c) => {
    if (c.inFiber < 1 || c.inFiber > X) return false;
    const b = branches.find((br) => br.line === c.outLine);
    if (!b) return false;
    return c.outFiber >= 1 && c.outFiber <= b.count;
  });
}

/** Sequential 1:1 strand mapping: incoming fiber N maps to the branch whose range contains N. */
export function autoSpliceByRange(joinFeat: Feature, telecomFeatures: Feature[]): FiberSplice[] {
  const X = parentFiberCount(joinFeat, telecomFeatures);
  const branches = validBranches(joinFeat, telecomFeatures);
  const out: FiberSplice[] = [];
  for (let f = 1; f <= X; f++) {
    const b = branches.find((br) => f >= br.from && f <= br.to);
    if (b) out.push({ inFiber: f, outLine: b.line, outFiber: f - b.from + 1 });
  }
  return out;
}

interface FiberNode {
  cable: string;
  fiber: number;
}
interface FiberAdjacencyEntry {
  node: FiberNode;
  splice: PointFeature;
}

/** Undirected graph of strand-to-strand connections across every telecom splice. */
export function fiberAdjacency(telecomFeatures: Feature[]): Map<string, FiberAdjacencyEntry[]> {
  const adj = new Map<string, FiberAdjacencyEntry[]>();
  const key = (c: string, f: number) => `${c}|${f}`;
  const add = (k: string, v: FiberAdjacencyEntry) => {
    if (!adj.has(k)) adj.set(k, []);
    adj.get(k)!.push(v);
  };
  for (const j of telecomFeatures) {
    if (j.type !== 'join') continue;
    for (const c of j.props.splices ?? []) {
      const a: FiberNode = { cable: j.props.parentLine ?? '', fiber: c.inFiber };
      const b: FiberNode = { cable: c.outLine, fiber: c.outFiber };
      if (!a.cable || !b.cable) continue;
      add(key(a.cable, a.fiber), { node: b, splice: j });
      add(key(b.cable, b.fiber), { node: a, splice: j });
    }
  }
  return adj;
}

export function fiberHasSignal(telecomFeatures: Feature[], cable: string, fiber: number): boolean {
  const adj = fiberAdjacency(telecomFeatures);
  return (adj.get(`${cable}|${fiber}`) ?? []).length > 0;
}

export interface FiberTraceHop {
  cable: string;
  fiber: number;
  splice: PointFeature | null;
}

/** Walks the connected component containing (startCable, startFiber) linearly from one end. */
export function fiberTrace(telecomFeatures: Feature[], startCable: string, startFiber: number): FiberTraceHop[] {
  const adj = fiberAdjacency(telecomFeatures);
  const key = (c: string, f: number) => `${c}|${f}`;
  const start: FiberNode = { cable: startCable, fiber: startFiber };

  const comp = new Set([key(start.cable, start.fiber)]);
  const q: FiberNode[] = [start];
  while (q.length) {
    const n = q.shift()!;
    for (const e of adj.get(key(n.cable, n.fiber)) ?? []) {
      const kk = key(e.node.cable, e.node.fiber);
      if (!comp.has(kk)) {
        comp.add(kk);
        q.push(e.node);
      }
    }
  }

  let head = start;
  for (const kk of comp) {
    if ((adj.get(kk) ?? []).length <= 1) {
      const [c, f] = kk.split('|');
      head = { cable: c, fiber: +f };
      break;
    }
  }

  const seq: FiberTraceHop[] = [];
  const seen = new Set<string>();
  let cur: FiberNode | null = head;
  let prevKey: string | null = null;
  while (cur) {
    const ck = key(cur.cable, cur.fiber);
    if (seen.has(ck)) break;
    seen.add(ck);
    const nbrs = (adj.get(ck) ?? []).filter(
      (e) => key(e.node.cable, e.node.fiber) !== prevKey && !seen.has(key(e.node.cable, e.node.fiber)),
    );
    const next = nbrs[0];
    seq.push({ cable: cur.cable, fiber: cur.fiber, splice: next ? next.splice : null });
    prevKey = ck;
    cur = next ? next.node : null;
  }
  return seq;
}
