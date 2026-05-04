import { useState } from 'react';
import { useCategories, useCreateCategory } from '@/hooks/useCategories';

interface Props {
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
}

export function CategorySelect({ categoryId, onCategoryChange }: Props) {
  const { data } = useCategories();
  const createCategory = useCreateCategory();
  const [newName, setNewName] = useState('');
  const [showNew, setShowNew] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    const category = await createCategory.mutateAsync(newName.trim());
    onCategoryChange(category.id);
    setNewName('');
    setShowNew(false);
  }

  return (
    <div>
      <div className="flex gap-2">
        <select
          value={categoryId ?? ''}
          onChange={e => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
          className="flex-1 px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">No category</option>
          {data?.items.map(category => (
            <option key={category.id} value={category.id}>{category.name}</option>
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
            placeholder="New category name"
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
