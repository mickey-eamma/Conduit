import { fiberColor, fiberName } from '../../../domain/constants';
import { effectiveFiberCount, fiberHasSignal } from '../../../domain/fiber';
import { Modal } from '../../../shared/ui/Modal';
import type { Feature, LineFeature } from '../../../domain/types';

interface FiberCableTableModalProps {
  line: LineFeature;
  telecomFeatures: Feature[];
  onClose: () => void;
  onTrace: (fiber: number) => void;
}

export function FiberCableTableModal({ line, telecomFeatures, onClose, onTrace }: FiberCableTableModalProps) {
  const count = effectiveFiberCount(line, telecomFeatures);
  const nm = line.props.name || line.code;
  const fibers = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <Modal className="fiber-modal" onClose={onClose}>
      <div className="fiber-dialog" style={{ width: 'min(460px,94vw)' }}>
        <div className="fiber-dlg-head">
          <div>
            <div className="t">Fibers · {nm}</div>
            <div className="s">{count} strands — click a fiber to trace its signal path</div>
          </div>
          <button type="button" className="x" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="fiber-stage-wrap" style={{ padding: '10px 14px' }}>
          {fibers.length ? (
            fibers.map((n) => {
              const sig = fiberHasSignal(telecomFeatures, line.code, n);
              return (
                <div
                  key={n}
                  className="ft-row"
                  onClick={() => {
                    onClose();
                    onTrace(n);
                  }}
                >
                  <span className="fib-dot" style={{ background: fiberColor(n) }} />
                  <span className="ft-no">{n}</span>
                  <span className="ft-nm">{fiberName(n)}</span>
                  <span className={`ft-sig${sig ? ' on' : ''}`}>{sig ? 'spliced' : '—'}</span>
                  <span className="ft-go">Trace ›</span>
                </div>
              );
            })
          ) : (
            <p className="attr-empty" style={{ padding: 16 }}>
              This cable has no fibers.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}
