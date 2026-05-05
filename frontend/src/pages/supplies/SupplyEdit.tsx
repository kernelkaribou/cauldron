import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupply, useUpdateSupply } from '@/hooks/useSupplies';
import { useSupplyTypes } from '@/hooks/useSupplyTypes';
import { DynamicAttributeForm } from '@/components/shared/DynamicAttributeForm';
import { ApiError } from '@/lib/api';
import type { SupplyTypeField, SupplyType } from '@/lib/types';

export function SupplyEdit() {
  const { id } = useParams();
  const supplyId = Number(id);
  const { data: supply, isLoading } = useSupply(supplyId);
  const updateSupply = useUpdateSupply();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [reusable, setReusable] = useState(false);
  const [typeId, setTypeId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: typesData } = useSupplyTypes(1, { per_page: '100' });

  const types: SupplyType[] = typesData?.items ?? [];
  const selectedType = types.find(p => p.id === typeId);
  const schema: SupplyTypeField[] = selectedType ? JSON.parse(selectedType.schema) : [];

  useEffect(() => {
    if (supply) {
      setName(supply.name);
      setDescription(supply.description || '');
      setUnit(supply.unit || '');
      setPrice(supply.price ? String(supply.price) : '');
      setBrand(supply.brand || '');
      setReusable(!!supply.reusable);
      setTypeId(supply.type_id);
      setAttributes(supply.attributes ? JSON.parse(supply.attributes) : {});
    }
  }, [supply]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

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
      await updateSupply.mutateAsync({
        id: supplyId,
        data: {
          name,
          description: description || undefined,
          unit: unit || undefined,
          price: price ? parseFloat(price) : 0,
          brand: brand || undefined,
          reusable: reusable ? 1 : 0,
          type_id: typeId,
          attributes: hasAttrs ? JSON.stringify(attributes) : undefined,
        },
      });
      navigate(`/supplies/${supplyId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
      else if (err instanceof ApiError) setErrors({ _: err.message });
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Edit Supply</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Type</label>
          <select value={typeId ?? ''} onChange={e => handleTypeChange(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
            <option value="">Select a type...</option>
            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          {errors.type_id && <p className="text-xs text-error mt-1">{errors.type_id}</p>}
        </div>
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
          <label className="block text-sm text-text-secondary mb-1">Unit</label>
          <input value={unit} onChange={e => setUnit(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Price</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Brand</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Optional brand name" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={reusable} onChange={e => setReusable(e.target.checked)} className="rounded" />
          Reusable (tool/equipment)
        </label>
        {schema.length > 0 && (
          <DynamicAttributeForm schema={schema} values={attributes} onChange={setAttributes} />
        )}
        {errors._ && <p className="text-xs text-error">{errors._}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={updateSupply.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">Save Changes</button>
          <button type="button" onClick={() => navigate(`/supplies/${supplyId}`)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
