import { DropdownMenu } from '../../shared/ui/DropdownMenu';

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
      <DropdownMenu trigger="Manage">
        <button type="button" className="menu-item" onClick={onSave}>
          Save client
        </button>
        <button type="button" className="menu-item" onClick={onNew}>
          New client
        </button>
        <button type="button" className="menu-item" onClick={onRename}>
          Rename client
        </button>
        <button type="button" className="menu-item danger" onClick={onDelete}>
          Delete client
        </button>
      </DropdownMenu>
    </div>
  );
}
