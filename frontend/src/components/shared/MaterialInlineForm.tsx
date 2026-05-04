import { useState } from 'react';
import { useCreateMaterial } from '@/hooks/useMaterials';
import { ApiError } from '@/lib/api';

interface MaterialInlineFormProps {
  onCreated: (material: { id: number; name: string; unit?: string }) => void;
  onCancel: () => void;
}

export function MaterialInlineForm({ onCreated, onCancel }: MaterialInlineFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [reusable, setReusable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createMaterial = useCreateMaterial();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    try {
      const material = await createMaterial.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        unit: unit.trim() || undefined,
        reusable: reusable ? 1 : 0,
      });
      onCreated({ id: material.id, name: material.name, unit: material.unit || undefined });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ form: 'Unable to create material right now.' });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-page p-4">
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Unit</label>
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="e.g., oz, yards, pieces"
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-text-secondary">
        <input
          type="checkbox"
          checked={reusable}
          onChange={e => setReusable(e.target.checked)}
          className="rounded"
        />
        Reusable (tool/equipment)
      </label>

      {errors.form && <p className="text-xs text-error">{errors.form}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={createMaterial.isPending || !name.trim()}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {createMaterial.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm text-text-secondary transition-colors hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
