import { useState } from 'react';
import { useCreateSupply } from '@/hooks/useSupplies';
import { useSupplyTypes } from '@/hooks/useSupplyTypes';
import { ApiError } from '@/lib/api';
import type { SupplyType } from '@/lib/types';

interface SupplyInlineFormProps {
  onCreated: (supply: { id: number; name: string; unit?: string }) => void;
  onCancel: () => void;
}

export function SupplyInlineForm({ onCreated, onCancel }: SupplyInlineFormProps) {
  const [name, setName] = useState('');
  const [typeId, setTypeId] = useState<number | null>(null);
  const [unit, setUnit] = useState('');
  const [reusable, setReusable] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSupply = useCreateSupply();
  const { data: typesData } = useSupplyTypes(1, { per_page: '100' });
  const types: SupplyType[] = typesData?.items ?? [];

  async function handleSave() {
    if (!name.trim() || !typeId) return;
    setErrors({});

    try {
      const supply = await createSupply.mutateAsync({
        name: name.trim(),
        unit: unit.trim() || undefined,
        reusable: reusable ? 1 : 0,
        type_id: typeId,
      });
      onCreated({ id: supply.id, name: supply.name, unit: supply.unit || undefined });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }
      setErrors({ form: 'Unable to create supply right now.' });
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-page p-4">
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Type</label>
        <select
          value={typeId ?? ''}
          onChange={e => setTypeId(e.target.value ? Number(e.target.value) : null)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
        >
          <option value="">Select a type...</option>
          {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        {errors.type_id && <p className="mt-1 text-xs text-error">{errors.type_id}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Name</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-error">{errors.name}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Unit</label>
        <input
          value={unit}
          onChange={e => setUnit(e.target.value)}
          placeholder="e.g., oz, yards, pieces"
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
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
          type="button"
          onClick={handleSave}
          disabled={createSupply.isPending || !name.trim() || !typeId}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-dark disabled:opacity-50"
        >
          {createSupply.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
