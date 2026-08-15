'use client';

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            active === tab.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {tab.label}
          {typeof tab.count === 'number' && (
            <span className={`ml-2 text-xs ${active === tab.key ? 'text-indigo-200' : 'text-gray-400'}`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
