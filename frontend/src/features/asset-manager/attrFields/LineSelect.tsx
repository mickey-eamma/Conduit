import type { LineFeature } from '../../../domain/types';

interface LineSelectProps {
  lines: LineFeature[];
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

/** The "— select line —" dropdown reused for parent/from/to/branch/downstream line pickers. */
export function LineSelect({ lines, value, onChange, className }: LineSelectProps) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— select line —</option>
      {lines.map((l) => (
        <option key={l.code} value={l.code}>
          {l.props.name || l.code}
        </option>
      ))}
    </select>
  );
}
