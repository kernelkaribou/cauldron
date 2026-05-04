import { useState } from 'react';
import { useCrafts, useCreateCraft } from '@/hooks/useCrafts';

interface Props {
  value: number | null;
  onChange: (id: number | null) => void;
}

export function CraftSelect({ value, onChange }: Props) {
  const { data } = useCrafts();
  const createCraft = useCreateCraft();
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    const craft = await createCraft.mutateAsync(newName.trim());
    onChange(craft.id);
    setNewName('');
    setShowNew(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">No craft</option>
          {data?.items.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:text-accent hover:border-accent transition-colors"
        >
          +
        </button>
      </div>
      {showNew && (
        <div className="flex gap-2 mt-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New craft name"
            className="flex-1 px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none text-sm"
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreate())}
          />
          <button
            type="button"
            onClick={handleCreate}
            className="px-3 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-light"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
