interface BasemapNoteProps {
  visible: boolean;
  onDismiss: () => void;
}

export function BasemapNote({ visible, onDismiss }: BasemapNoteProps) {
  return (
    <div className={`basemap-note${visible ? ' show' : ''}`}>
      <span className="bm-dot" />
      <span>
        <b>Basemap offline in this preview.</b> You&apos;re seeing a coordinate grid instead of streets. Download
        this file and open it locally, or deploy it, and the Esri basemap loads automatically. Drawing, snapping,
        and export all work here.
      </span>
      <button type="button" className="bm-x" aria-label="Dismiss" onClick={onDismiss}>
        &times;
      </button>
    </div>
  );
}
