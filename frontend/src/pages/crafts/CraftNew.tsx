import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TechniquePicker } from '@/components/shared/TechniquePicker';
import { SupplyPicker } from '@/components/shared/SupplyPicker';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { useCreateCraft } from '@/hooks/useCrafts';
import { ApiError } from '@/lib/api';
import { buildSupplyPayload, buildTechniquePayload, type SupplySelection, type TechniqueSelection } from '@/pages/crafts/craftFormUtils';

export function CraftNew() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [techniques, setTechniques] = useState<TechniqueSelection[]>([]);
  const [supplies, setSupplies] = useState<SupplySelection[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCraft = useCreateCraft();
  const navigate = useNavigate();

  const isSubmitDisabled = !title.trim() || techniques.length < 1 || supplies.length < 1 || createCraft.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    try {
      const craft = await createCraft.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        category_id: categoryId,
        duration_minutes: duration ? parseInt(duration, 10) : undefined,
        techniques: buildTechniquePayload(techniques),
        supplies: buildSupplyPayload(supplies),
      });
      navigate(`/crafts/${craft.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ form: 'Unable to create craft right now.' });
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-xl font-semibold text-text-primary">New Craft</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="rounded-xl border border-border bg-card p-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-text-secondary">Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
            {errors.title && <p className="mt-1 text-xs text-error">{errors.title}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-y rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Category</label>
            <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
          </div>

          <div>
            <label className="mb-1 block text-sm text-text-secondary">Estimated Duration (minutes)</label>
            <input
              type="number"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              min="0"
              className="w-full rounded-lg border border-border bg-page px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        <TechniquePicker
          selected={techniques}
          onAdd={item => setTechniques(current => [...current, { ...item }])}
          onCreate={item => setTechniques(current => [...current, { mode: 'existing', id: item.id, title: item.title }])}
          onRemove={id => setTechniques(current => current.filter(item => item.id !== id))}
        />

        <SupplyPicker
          selected={supplies}
          onAdd={item => setSupplies(current => [...current, { ...item, quantity: undefined }])}
          onCreate={item => setSupplies(current => [...current, { mode: 'existing', id: item.id, name: item.name, unit: item.unit }])}
          onRemove={id => setSupplies(current => current.filter(item => item.id !== id))}
          onUpdate={(id, changes) => setSupplies(current => current.map(item => (item.id === id ? { ...item, ...changes } : item)))}
        />

        {errors.form && <p className="text-sm text-error">{errors.form}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="rounded-lg bg-accent px-4 py-2 font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {createCraft.isPending ? 'Creating...' : 'Create Craft'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/crafts')}
            className="rounded-lg border border-border px-4 py-2 text-text-secondary transition-colors hover:border-accent"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
