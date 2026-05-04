import { useState } from 'react';
import { useCrafts } from '@/hooks/useCrafts';

interface CraftSelection {
  id: number;
  title: string;
  quantity: number;
}

interface CraftPickerProps {
  selected: CraftSelection[];
  onChange: (crafts: CraftSelection[]) => void;
}

export function CraftPicker({ selected, onChange }: CraftPickerProps) {
  const [search, setSearch] = useState('');
  const { data } = useCrafts(1, { search: search || undefined });

  function addCraft(craft: { id: number; title: string }) {
    if (selected.some(s => s.id === craft.id)) return;
    onChange([...selected, { id: craft.id, title: craft.title, quantity: 1 }]);
    setSearch('');
  }

  function removeCraft(id: number) {
    if (selected.length <= 1) return;
    onChange(selected.filter(s => s.id !== id));
  }

  function updateQuantity(id: number, quantity: number) {
    onChange(selected.map(s => s.id === id ? { ...s, quantity: Math.max(1, quantity) } : s));
  }

  const availableCrafts = data?.items.filter(c => !selected.some(s => s.id === c.id)) || [];

  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">Crafts <span className="text-error">*</span></label>

      {selected.length > 0 && (
        <div className="space-y-2 mb-3">
          {selected.map(craft => (
            <div key={craft.id} className="flex items-center gap-2 p-2 bg-page border border-border rounded-lg">
              <span className="flex-1 text-sm text-text-primary">{craft.title}</span>
              <label className="text-xs text-text-muted">Qty:</label>
              <input
                type="number"
                min="1"
                value={craft.quantity}
                onChange={e => updateQuantity(craft.id, parseInt(e.target.value, 10) || 1)}
                className="w-14 px-2 py-1 bg-card border border-border rounded text-xs text-text-primary focus:border-accent focus:outline-none"
              />
              {selected.length > 1 && (
                <button onClick={() => removeCraft(craft.id)} className="text-xs text-text-muted hover:text-error">×</button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search crafts to add..."
          className="w-full px-3 py-2 bg-page border border-border rounded-lg text-sm text-text-primary focus:border-accent focus:outline-none"
        />
        {search && availableCrafts.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
            {availableCrafts.map(craft => (
              <button key={craft.id} onClick={() => addCraft(craft)} className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-page transition-colors">
                {craft.title}
              </button>
            ))}
          </div>
        )}
        {search && availableCrafts.length === 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 p-3">
            <p className="text-xs text-text-muted">No matching crafts found.</p>
          </div>
        )}
      </div>
      {selected.length === 0 && <p className="text-xs text-error mt-1">At least one craft is required</p>}
    </div>
  );
}
