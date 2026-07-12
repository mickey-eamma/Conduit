import type { Dispatch } from 'react';
import { fiberColor, fiberName } from '../../../domain/constants';
import { autoSpliceByRange, parentFiberCount, pruneSplices, validBranches } from '../../../domain/fiber';
import { lineByCode } from '../../../state/network/networkSelectors';
import { Modal } from '../../../shared/ui/Modal';
import { FiberNode } from './FiberNode';
import { useSpliceMatrixWires } from './useSpliceMatrixWires';
import type { PointFeature } from '../../../domain/types';
import type { NetworkAction, NetworkState } from '../../../state/network/networkTypes';

interface SpliceMatrixModalProps {
  feature: PointFeature;
  network: NetworkState;
  networkDispatch: Dispatch<NetworkAction>;
  onClose: () => void;
}

export function SpliceMatrixModal({ feature, network, networkDispatch, onClose }: SpliceMatrixModalProps) {
  const telecomFeatures = network.networks.telecom.features;
  const X = parentFiberCount(feature, telecomFeatures);
  const branches = validBranches(feature, telecomFeatures);
  const inCable = feature.props.parentLine ? lineByCode(network, 'telecom', feature.props.parentLine) : undefined;
  const splices = pruneSplices(feature, telecomFeatures);

  function setSplices(next: typeof splices) {
    networkDispatch({ type: 'UPDATE_FEATURE_PROPS', util: 'telecom', id: feature.id, props: { splices: next } });
  }

  const { registerNode, onNodePointerDown, armedKey, wires, tempWireD, svgSize, stageRef, scrollContainerRef } =
    useSpliceMatrixWires(splices, (inFiber, outLine, outFiber) => {
      const next = splices.filter((s) => s.inFiber !== inFiber && !(s.outLine === outLine && s.outFiber === outFiber));
      next.push({ inFiber, outLine, outFiber });
      setSplices(next);
    });

  if (!inCable || !branches.length) {
    return (
      <Modal className="fiber-modal" onClose={onClose}>
        <div className="fiber-dialog">
          <div className="fiber-dlg-head">
            <div>
              <div className="t">Fiber splice matrix</div>
            </div>
            <button type="button" className="x" onClick={onClose}>
              &times;
            </button>
          </div>
          <div className="fiber-stage-wrap">
            <p className="attr-empty" style={{ padding: 20 }}>
              Assign the incoming cable and at least one branch with a fiber range before splicing strands.
            </p>
          </div>
        </div>
      </Modal>
    );
  }

  const connectedKeys = new Set<string>();
  for (const s of splices) {
    connectedKeys.add(`in:${s.inFiber}`);
    connectedKeys.add(`out:${s.outLine}:${s.outFiber}`);
  }

  const inNodes: { fiber: number; tubeHeader: string | null }[] = [];
  for (let n = 1; n <= X; n++) {
    inNodes.push({ fiber: n, tubeHeader: (n - 1) % 12 === 0 ? `Tube ${Math.floor((n - 1) / 12) + 1} · ${fiberName(n)}` : null });
  }

  return (
    <Modal className="fiber-modal" onClose={onClose}>
      <div className="fiber-dialog">
        <div className="fiber-dlg-head">
          <div>
            <div className="t">Fiber splice matrix · {feature.props.name || feature.code}</div>
            <div className="s">
              Incoming: {inCable.props.name || inCable.code} ({X}f) — click a fiber then click one across, or drag between
              them
            </div>
          </div>
          <button type="button" className="x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="fiber-stage-wrap" ref={scrollContainerRef}>
          <div className="fiber-stage" ref={stageRef}>
            <div className="fiber-col left">
              <div className="col-h">Incoming</div>
              {inNodes.map(({ fiber, tubeHeader }) => (
                <div key={fiber}>
                  {tubeHeader && <div className="tube-h">{tubeHeader}</div>}
                  <FiberNode
                    side="in"
                    line={null}
                    fiber={fiber}
                    connected={connectedKeys.has(`in:${fiber}`)}
                    armed={armedKey === `in::${fiber}`}
                    nodeRef={registerNode('in', null, fiber)}
                    onPointerDown={onNodePointerDown({ side: 'in', line: null, fiber })}
                  />
                </div>
              ))}
            </div>
            <svg
              className="fiber-wires"
              style={{ width: svgSize.width, height: svgSize.height }}
            >
              {wires.map((w) => (
                <path
                  key={w.index}
                  className="wire"
                  d={w.d}
                  fill="none"
                  stroke={fiberColor(splices[w.index]?.inFiber ?? 1)}
                  strokeWidth={2.6}
                  onClick={() => setSplices(splices.filter((_, idx) => idx !== w.index))}
                />
              ))}
              <path className="temp-wire" fill="none" stroke="var(--telecom)" strokeWidth={2.6} strokeDasharray="5 4" d={tempWireD} />
            </svg>
            <div className="fiber-col right">
              <div className="col-h">Outgoing</div>
              {branches.map((b) => {
                const ln = lineByCode(network, 'telecom', b.line);
                const nm = ln ? ln.props.name || ln.code : b.line;
                return (
                  <div className="branch-group" key={b.line}>
                    <div className="bg-h">
                      {nm} · {b.count}f <span className="bg-sub">(feeder {b.from}–{b.to})</span>
                    </div>
                    {Array.from({ length: b.count }, (_, idx) => idx + 1).map((m) => (
                      <FiberNode
                        key={m}
                        side="out"
                        line={b.line}
                        fiber={m}
                        connected={connectedKeys.has(`out:${b.line}:${m}`)}
                        armed={armedKey === `out:${b.line}:${m}`}
                        nodeRef={registerNode('out', b.line, m)}
                        onPointerDown={onNodePointerDown({ side: 'out', line: b.line, fiber: m })}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="fiber-dlg-foot">
          <span className="sp">
            <b>{splices.length} spliced</b> of {X}
          </span>
          <button type="button" className="btn" onClick={() => setSplices(autoSpliceByRange(feature, telecomFeatures))}>
            Auto-splice by range
          </button>
          <button type="button" className="btn danger" onClick={() => setSplices([])}>
            Clear
          </button>
          <button type="button" className="btn primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </Modal>
  );
}
