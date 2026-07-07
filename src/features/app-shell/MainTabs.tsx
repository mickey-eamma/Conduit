import type { MainView } from '../../state/ui/uiTypes';

interface MainTabsProps {
  active: MainView;
  onChange: (view: MainView) => void;
}

const TABS: { id: MainView; label: string }[] = [
  { id: 'assets', label: 'Asset Manager' },
  { id: 'crossings', label: 'Crossings' },
  { id: 'builder', label: 'Map Builder' },
];

export function MainTabs({ active, onChange }: MainTabsProps) {
  return (
    <div className="main-tabs">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`mt${active === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
