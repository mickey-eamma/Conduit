import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fiberColor, fiberName } from '../../../domain/constants';
import { formatLength, lineLengthMeters } from '../../../domain/geometry';
import { lineByCode } from '../../../state/network/networkSelectors';
import type { FiberTraceHop } from '../../../domain/fiber';
import type { NetworkState } from '../../../state/network/networkTypes';

interface SignalTraceModalProps {
  network: NetworkState;
  seq: FiberTraceHop[];
  startCable: string;
  startFiber: number;
  onClose: () => void;
}

export function SignalTraceModal({ network, seq, startCable, startFiber, onClose }: SignalTraceModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const startLine = lineByCode(network, 'telecom', startCable);
  const startNm = startLine?.props.name || startCable;
  const hops = seq.filter((s) => s.splice).length;
  const uniqCables = [...new Set(seq.map((s) => s.cable))];
  let totalM = 0;
  for (const c of uniqCables) {
    const ln = lineByCode(network, 'telecom', c);
    if (ln) totalM += lineLengthMeters(ln.latlngs);
  }

  return createPortal(
    <div className="trace-panel">
      <div className="trace-head">
        <div>
          <b>Signal trace</b> · {startNm} fiber {startFiber}
        </div>
        <div className="trace-meta">
          {uniqCables.length} cable{uniqCables.length !== 1 ? 's' : ''} · {hops} splice{hops !== 1 ? 's' : ''} ·{' '}
          {formatLength(totalM)} run
        </div>
        <button type="button" className="x" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="trace-chain">
        {seq.length ? (
          seq.map((s, i) => {
            const ln = lineByCode(network, 'telecom', s.cable);
            const nm = ln ? ln.props.name || ln.code : s.cable;
            const place = ln?.props.placement === 'Underground' ? 'Underground' : 'Aerial';
            const isStart = s.cable === startCable && s.fiber === startFiber;
            const tube = Math.ceil(s.fiber / 12);
            const pos = ((s.fiber - 1) % 12) + 1;
            const c = fiberColor(s.fiber);
            const next = seq[i + 1];
            return (
              <div key={`${s.cable}-${s.fiber}`} style={{ display: 'contents' }}>
                <div className={`trace-card${isStart ? ' start' : ''}`}>
                  <div className="tc-strand" style={{ background: c }} />
                  <div className="tc-name">{nm}</div>
                  <div className="tc-fiber">
                    <span className="fib-dot" style={{ background: c }} />
                    Fiber {s.fiber} · {fiberName(s.fiber)}
                  </div>
                  <div className="tc-tube">
                    Tube {tube} · position {pos}
                  </div>
                  <div className={`tc-place ${place === 'Underground' ? 'ug' : 'ae'}`}>{place}</div>
                </div>
                {s.splice && (
                  <div className="trace-link" style={{ ['--c' as string]: c }}>
                    <span className="tl-fibers">
                      F{s.fiber} → F{next ? next.fiber : s.fiber}
                    </span>
                    <span className="tl-label">{s.splice.props.name || s.splice.code}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <span className="trace-empty">This fiber isn&rsquo;t spliced to anything yet.</span>
        )}
      </div>
    </div>,
    document.body,
  );
}
