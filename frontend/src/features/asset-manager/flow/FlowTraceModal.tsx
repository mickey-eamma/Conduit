import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { UTILS } from '../../../domain/constants';
import { formatLength, lineLengthMeters } from '../../../domain/geometry';
import { lineByCode } from '../../../state/network/networkSelectors';
import type { StatusName } from '../../../domain/types';
import type { NetworkState } from '../../../state/network/networkTypes';
import type { FlowTraceState } from './useFlowTrace';

interface FlowTraceModalProps {
  network: NetworkState;
  trace: FlowTraceState;
  onClose: () => void;
}

export function FlowTraceModal({ network, trace, onClose }: FlowTraceModalProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const { util, startCode, dir, levels } = trace;
  const color = UTILS[util].color;
  const term = UTILS[util].terms.line;
  const dirWord = dir === 'up' ? 'upstream' : 'downstream';
  const startLine = lineByCode(network, util, startCode);
  const startNm = startLine?.props.name || startCode;

  // Left is always the source side: for an upstream trace, reverse so sources sit left of the start pipe.
  const cols = dir === 'up' ? [...levels].reverse() : levels;

  const otherCodes = levels.flat().filter((c) => c !== startCode);
  let totalM = 0;
  for (const code of otherCodes) {
    const ln = lineByCode(network, util, code);
    if (ln) totalM += lineLengthMeters(ln.latlngs);
  }

  return createPortal(
    <div className="trace-panel">
      <div className="trace-head">
        <div>
          <b>{dir === 'up' ? 'Upstream' : 'Downstream'} flow</b> · {startNm}
        </div>
        <div className="trace-meta">
          {otherCodes.length} {dirWord} {term.toLowerCase()}
          {otherCodes.length !== 1 ? 's' : ''} · {formatLength(totalM)} run
        </div>
        <button type="button" className="x" onClick={onClose}>
          &times;
        </button>
      </div>
      <div className="trace-chain">
        {otherCodes.length ? (
          cols.map((col, ci) => (
            <div key={ci} style={{ display: 'contents' }}>
              <div className="flow-col">
                {col.map((code) => {
                  const ln = lineByCode(network, util, code);
                  if (!ln) return null;
                  const isStart = code === startCode;
                  const status: StatusName = ln.props.status || 'Active';
                  return (
                    <div key={code} className={`trace-card${isStart ? ' flow-start' : ''}`} style={{ ['--c' as string]: color }}>
                      <div className="tc-strand" style={{ background: color }} />
                      <div className="tc-name">{ln.props.name || ln.code}</div>
                      <div className="tc-fiber">
                        {term} · {formatLength(lineLengthMeters(ln.latlngs))}
                      </div>
                      <div className="tc-tube">{status}</div>
                    </div>
                  );
                })}
              </div>
              {ci < cols.length - 1 && (
                <div className="flow-link" style={{ ['--c' as string]: color }}>
                  <span className="fl-arrow">→</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <span className="trace-empty">
            No {dirWord} {term.toLowerCase()}s from here — set the upstream/downstream pipes at the joints.
          </span>
        )}
      </div>
    </div>,
    document.body,
  );
}
