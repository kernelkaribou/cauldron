import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateIngredient } from '@/hooks/useIngredients';
import { ApiError } from '@/lib/api';

export function IngredientNew() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [reusable, setReusable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createIngredient = useCreateIngredient();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const ing = await createIngredient.mutateAsync({ name, description: description || undefined, unit: unit || undefined, reusable: reusable ? 1 : 0 });
      navigate(`/ingredients/${ing.id}`);
    } catch (err) { if (err instanceof ApiError && err.details) setErrors(err.details); }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">New Ingredient</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Unit of Measure</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., oz, yards, pieces" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={reusable} onChange={e => setReusable(e.target.checked)} className="rounded" />
          Reusable (tool/equipment)
        </label>
        <button type="submit" disabled={createIngredient.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
          {createIngredient.isPending ? 'Creating...' : 'Create Ingredient'}
        </button>
      </form>
    </div>
  );
}
