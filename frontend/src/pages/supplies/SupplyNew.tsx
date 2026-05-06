import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSupply } from '@/hooks/useSupplies';
import { useSupplyTypes } from '@/hooks/useSupplyTypes';
import { DynamicAttributeForm } from '@/components/shared/DynamicAttributeForm';
import { ApiError } from '@/lib/api';
import type { SupplyTypeField, SupplyType } from '@/lib/types';

export function SupplyNew() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [reusable, setReusable] = useState(false);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSupply = useCreateSupply();
  const navigate = useNavigate();
  const { data: typesData } = useSupplyTypes(1, { per_page: '100' });

  const types: SupplyType[] = typesData?.items ?? [];
  const selectedType = types.find(p => p.id === typeId);
  const schema: SupplyTypeField[] = selectedType ? JSON.parse(selectedType.schema) : [];

  function handleTypeChange(id: string) {
    const numId = id ? Number(id) : null;
    setTypeId(numId);
    setAttributes({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    const hasAttrs = Object.keys(attributes).filter(k => attributes[k] !== undefined).length > 0;
    try {
      const supply = await createSupply.mutateAsync({
        name,
        description: description || undefined,
        unit: unit || undefined,
        price: price ? parseFloat(price) : 0,
        brand: brand || undefined,
        reusable: reusable ? 1 : 0,
        type_id: typeId,
        attributes: hasAttrs ? JSON.stringify(attributes) : undefined,
      });
      navigate(`/supplies/${supply.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else if (err instanceof ApiError) setErrors({ _: err.message });
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">New Supply</h1>
      {types.length === 0 ? (
        <div className="p-6 bg-card border border-dashed border-border rounded-xl text-center">
          <p className="text-text-secondary mb-3">You need to create a supply type first.</p>
          <button onClick={() => navigate('/supplies/types/new?return=/supplies/new')} className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm">
            Create a Type
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Type</label>
          <select value={typeId ?? ''} onChange={e => handleTypeChange(e.target.value)} required className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none">
            <option value="">Select a type...</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {errors.type_id && <p className="text-xs text-error mt-1">{errors.type_id}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
          {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Unit of Measure</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="e.g., oz, yards, pieces" className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Price</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Brand</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Optional brand name" className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={reusable} onChange={e => setReusable(e.target.checked)} className="rounded" />
          Reusable (tool/equipment)
        </label>
        {schema.length > 0 && (
          <DynamicAttributeForm schema={schema} values={attributes} onChange={setAttributes} />
        )}
        {errors._ && <p className="text-xs text-error">{errors._}</p>}
        <button type="submit" disabled={createSupply.isPending} className="px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all disabled:opacity-50">
          {createSupply.isPending ? 'Creating...' : 'Create Supply'}
        </button>
      </form>
      )}
    </div>
  );
}
