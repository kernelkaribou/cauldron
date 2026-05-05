import { useState } from 'react';
import { useCrafts } from '@/hooks/useCrafts';
import { SearchDropdown } from '@/components/shared/SearchDropdown';

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
  }

  function removeCraft(id: number) {
    onChange(selected.filter(s => s.id !== id));
  }

  function updateQuantity(id: number, quantity: number) {
    onChange(selected.map(s => s.id === id ? { ...s, quantity: Math.max(1, quantity) } : s));
  }

  const availableCrafts = data?.items.filter(c => !selected.some(s => s.id === c.id)) || [];

  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">Crafts</label>

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
              <button onClick={() => removeCraft(craft.id)} className="text-xs text-text-muted hover:text-error">×</button>
            </div>
          ))}
        </div>
      )}

      <SearchDropdown
        placeholder="Search crafts to add..."
        items={availableCrafts.map(c => ({ id: c.id, label: c.title }))}
        onSelect={item => addCraft({ id: item.id, title: item.label })}
        onSearchChange={setSearch}
        emptyMessage="No matching crafts found."
      />
    </div>
  );
}
