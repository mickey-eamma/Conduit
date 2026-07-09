import { ORDER, UTILS } from '../../domain/constants';
import type { BasemapId, UtilId } from '../../domain/types';
import { BasemapSelect } from '../map-builder/BasemapSelect';

interface NetworkDesignSidebarProps {
  status: string;
  statusErr: boolean;
  canAdd: boolean;
  target: UtilId;
  onTargetChange: (util: UtilId) => void;
  basemap: BasemapId;
  onBasemapChange: (basemap: BasemapId) => void;
  onUndo: () => void;
  onClear: () => void;
  onAdd: () => void;
}

export function NetworkDesignSidebar({
  status,
  statusErr,
  canAdd,
  target,
  onTargetChange,
  basemap,
  onBasemapChange,
  onUndo,
  onClear,
  onAdd,
}: NetworkDesignSidebarProps) {
  return (
    <aside className="nd-side">
      <section>
        <h3>Route along streets</h3>
        <p className="note">Click the map to drop points — start, any waypoints, then the end. Conduit routes along the OpenStreetMap street network between them.</p>
        <div className={`nd-status${statusErr ? ' err' : ''}`}>{status}</div>
        <div className="nd-actions">
          <button type="button" className="btn" onClick={onUndo}>
            Undo point
          </button>
          <button type="button" className="btn danger" onClick={onClear}>
            Clear
          </button>
        </div>
      </section>
      <section>
        <h3>Fine-tune</h3>
        <p className="note">
          Drag a vertex to move it &middot; click a <b>+</b> to add one &middot; right-click a vertex to delete. Adjust the routed line before adding it.
        </p>
      </section>
      <section className="nd-foot">
        <h3>Add to network</h3>
        <select className="bm-select" value={target} onChange={(e) => onTargetChange(e.target.value as UtilId)}>
          {ORDER.map((id) => (
            <option key={id} value={id}>
              {UTILS[id].label}
            </option>
          ))}
        </select>
        <button type="button" className="btn primary" id="ndAdd" disabled={!canAdd} onClick={onAdd}>
          Add line to network
        </button>
      </section>
      <section>
        <h3>Basemap</h3>
        <BasemapSelect value={basemap} onChange={onBasemapChange} />
      </section>
    </aside>
  );
}
