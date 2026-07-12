import type { ActiveView } from '../../state/ui/uiTypes';

interface ViewTabsProps {
  active: ActiveView;
  onChange: (view: ActiveView) => void;
}

export function ViewTabs({ active, onChange }: ViewTabsProps) {
  return (
    <div className="view-tabs" id="viewTabs">
      <button className={`vt${active === 'map' ? ' active' : ''}`} onClick={() => onChange('map')}>
        Map
      </button>
      <button className={`vt${active === 'dashboard' ? ' active' : ''}`} onClick={() => onChange('dashboard')}>
        Dashboard
      </button>
    </div>
  );
}
