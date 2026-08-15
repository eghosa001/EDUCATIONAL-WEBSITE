'use client';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
}

export default function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </button>
      {(label || description) && (
        <div>
          {label && <span className="text-sm text-gray-700 block">{label}</span>}
          {description && <span className="text-xs text-gray-400 block">{description}</span>}
        </div>
      )}
    </label>
  );
}
