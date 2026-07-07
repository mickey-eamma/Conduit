interface ClientBarProps {
  clientNames: string[];
  currentClient: string | null;
  onSelect: (name: string) => void;
  onSave: () => void;
  onNew: () => void;
  onRename: () => void;
  onDelete: () => void;
}

export function ClientBar({
  clientNames,
  currentClient,
  onSelect,
  onSave,
  onNew,
  onRename,
  onDelete,
}: ClientBarProps) {
  return (
    <div className="client-bar">
      <span className="cb-icon">Client</span>
      <select
        className="client-sel"
        value={currentClient ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="">— None —</option>
        {clientNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <button type="button" className="btn cb-btn" title="Save current networks to this client" onClick={onSave}>
        Save
      </button>
      <button type="button" className="btn cb-btn" title="Start a new blank client" onClick={onNew}>
        New
      </button>
      <button type="button" className="btn cb-btn" title="Rename this client" onClick={onRename}>
        Rename
      </button>
      <button type="button" className="btn cb-btn danger" title="Delete this client" onClick={onDelete}>
        Delete
      </button>
    </div>
  );
}
