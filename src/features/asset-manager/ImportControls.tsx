import { useRef } from 'react';
import { ORDER, UTILS } from '../../domain/constants';
import type { UtilId } from '../../domain/types';
import type { UseImportPreviewResult } from './useImportPreview';

interface ImportControlsProps {
  importPreview: UseImportPreviewResult;
}

export function ImportControls({ importPreview }: ImportControlsProps) {
  const { items, targetUtil, setTargetUtil, onFileSelected, importAll, clear } = importPreview;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasItems = items.length > 0;

  return (
    <div className="import-ctl">
      <button
        type="button"
        className="btn import-btn"
        title="Import a KMZ/KML/DWG and trace its lines into a network"
        onClick={() => fileInputRef.current?.click()}
      >
        &#8613; Import KMZ / DWG
      </button>
      <input
        type="file"
        ref={fileInputRef}
        accept=".kmz,.kml,.dwg,application/vnd.google-earth.kmz,application/vnd.google-earth.kml+xml,image/vnd.dwg,application/acad"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void onFileSelected(file);
          e.target.value = '';
        }}
      />
      {hasItems && (
        <select
          className="import-net"
          title="Add imported lines to this network"
          value={targetUtil}
          onChange={(e) => setTargetUtil(e.target.value as UtilId)}
        >
          {ORDER.map((id) => (
            <option key={id} value={id}>
              {UTILS[id].label}
            </option>
          ))}
        </select>
      )}
      {hasItems && (
        <button type="button" className="btn import-all" onClick={importAll}>
          Add all ({items.length})
        </button>
      )}
      {hasItems && (
        <button type="button" className="btn import-clear" onClick={clear}>
          Clear import ({items.length})
        </button>
      )}
    </div>
  );
}
