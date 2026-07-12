import type { BasemapId } from '../../domain/types';

interface BasemapSelectProps {
  value: BasemapId;
  onChange: (basemap: BasemapId) => void;
}

export function BasemapSelect({ value, onChange }: BasemapSelectProps) {
  return (
    <select className="bm-select" value={value} onChange={(e) => onChange(e.target.value as BasemapId)}>
      <option value="gray">Light gray</option>
      <option value="streets">Streets</option>
      <option value="imagery">Imagery</option>
    </select>
  );
}
