import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { defaultAsset } from '../../domain/eventHistory';
import type { UseEventHistoryResult } from './useEventHistory';
import type { AssetRecord } from '../../domain/types';

interface EventHistoryModalProps {
  eventHistory: UseEventHistoryResult;
}

function AssetTable({ asset, onChange }: { asset: AssetRecord; onChange: (patch: Partial<AssetRecord>) => void }) {
  return (
    <div className="eh-asset">
      <div className="eh-cell">
        <label>Asset Name</label>
        <input value={asset.assetName} onChange={(e) => onChange({ assetName: e.target.value })} />
      </div>
      <div className="eh-cell">
        <label>Project No.</label>
        <input value={asset.projectNo} onChange={(e) => onChange({ projectNo: e.target.value })} />
      </div>
      <div className="eh-cell">
        <label>Project Date</label>
        <input type="date" value={asset.projectDate} onChange={(e) => onChange({ projectDate: e.target.value })} />
      </div>
      <div className="eh-cell span2">
        <label>Manufacturer</label>
        <input value={asset.manufacturer} onChange={(e) => onChange({ manufacturer: e.target.value })} />
      </div>
      <div className="eh-cell">
        <label>Description</label>
        <input value={asset.description} onChange={(e) => onChange({ description: e.target.value })} />
      </div>
    </div>
  );
}

/**
 * Two-level modal (stage list <-> a stage's event list). Deliberately NOT
 * built on the generic Modal.tsx: Escape here steps back one level before it
 * closes, whereas Modal.tsx's Escape always closes outright. Backdrop click
 * always closes fully, matching the original.
 */
export function EventHistoryModal({ eventHistory }: EventHistoryModalProps) {
  const { feature, stageIndex, close, openStage, backToStages, onEscape, updateAsset, addStage, removeStage, addEvent, removeEvent, updateEvent } =
    eventHistory;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onEscape();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onEscape]);

  if (!feature) return null;
  const asset = feature.props.asset ?? defaultAsset(feature);
  const stages = feature.props.stages ?? [];

  return createPortal(
    <div className="eh-modal" onPointerDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="eh-dialog">
        {stageIndex === null ? (
          <>
            <div className="eh-head">
              <div className="t">
                Event History <span className="code">{feature.code}</span>
              </div>
              <button type="button" className="x" onClick={close}>
                &times;
              </button>
            </div>
            <div className="eh-body eh-stages">
              <AssetTable asset={asset} onChange={updateAsset} />
              <h4 className="eh-sub">Stages</h4>
              <div id="ehStageList">
                {stages.length ? (
                  stages.map((s, i) => (
                    <div key={i} className="stage-bar" onClick={() => openStage(i)}>
                      <span className="sb-name">{s.name || 'Stage'}</span>
                      <button
                        type="button"
                        className="sb-del"
                        title="Remove stage"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Remove stage "${s.name || 'Stage'}"? Its events will be deleted.`)) removeStage(i);
                        }}
                      >
                        &times;
                      </button>
                      <span className="sb-go">&#9654;</span>
                    </div>
                  ))
                ) : (
                  <p className="eh-empty">No stages yet — add one below.</p>
                )}
              </div>
              <div className="eh-addwrap">
                <button
                  type="button"
                  className="eh-add"
                  onClick={() => {
                    const nm = (window.prompt('New stage name:') || '').trim();
                    if (nm) addStage(nm);
                  }}
                >
                  &#65291; Add Stage
                </button>
              </div>
            </div>
          </>
        ) : (
          (() => {
            const stage = stages[stageIndex];
            if (!stage) return null;
            return (
              <>
                <div className="eh-head">
                  <div className="t">
                    <button type="button" className="eh-back" title="Back to stages" onClick={backToStages}>
                      &#8592;
                    </button>
                    <span className="eh-stagename">{stage.name || 'Stage'}</span>
                    <span className="code">{feature.code}</span>
                  </div>
                  <button type="button" className="x" onClick={close}>
                    &times;
                  </button>
                </div>
                <div className="eh-body">
                  <AssetTable asset={asset} onChange={updateAsset} />
                  <h4 className="eh-sub">{stage.name || 'Stage'} events</h4>
                  <div id="ehEvents">
                    {stage.events.length ? (
                      stage.events.map((ev, i) => (
                        <div key={i} className="eh-erow">
                          <button type="button" className="ev-ctrl" title="Remove event" onClick={() => removeEvent(i)}>
                            &#8722;
                          </button>
                          <div className="eh-event">
                            <div className="ev-top">
                              <div className="ev-cell">
                                <label>Event No.</label>
                                <input value={ev.no} onChange={(e) => updateEvent(i, { no: e.target.value })} />
                              </div>
                              <div className="ev-cell">
                                <label>Event Title</label>
                                <input value={ev.title} onChange={(e) => updateEvent(i, { title: e.target.value })} />
                              </div>
                              <div className="ev-cell">
                                <label>Event Date</label>
                                <input type="date" value={ev.date} onChange={(e) => updateEvent(i, { date: e.target.value })} />
                              </div>
                            </div>
                            <div className="ev-desc">
                              <label>Event Description</label>
                              <input value={ev.desc} onChange={(e) => updateEvent(i, { desc: e.target.value })} />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="eh-empty">No events yet — use "Add Event" below.</p>
                    )}
                  </div>
                  <div className="eh-addwrap">
                    <button type="button" className="eh-add" onClick={addEvent}>
                      &#65291; Add Event
                    </button>
                  </div>
                </div>
              </>
            );
          })()
        )}
      </div>
    </div>,
    document.body,
  );
}
