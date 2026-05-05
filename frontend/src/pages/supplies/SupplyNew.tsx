import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateSupply } from '@/hooks/useSupplies';
import { useSupplyProfiles } from '@/hooks/useSupplyProfiles';
import { DynamicAttributeForm } from '@/components/shared/DynamicAttributeForm';
import { ApiError } from '@/lib/api';
import type { SupplyProfileField, SupplyProfile } from '@/lib/types';

export function SupplyNew() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [material, setMaterial] = useState('');
  const [brand, setBrand] = useState('');
  const [reusable, setReusable] = useState(false);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [attributes, setAttributes] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createSupply = useCreateSupply();
  const navigate = useNavigate();
  const { data: profilesData } = useSupplyProfiles(1, { per_page: '100' });

  const profiles: SupplyProfile[] = profilesData?.items ?? [];
  const selectedProfile = profiles.find(p => p.id === profileId);
  const schema: SupplyProfileField[] = selectedProfile ? JSON.parse(selectedProfile.schema) : [];

  function handleProfileChange(id: string) {
    const numId = id ? Number(id) : null;
    setProfileId(numId);
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
        material: material || undefined,
        brand: brand || undefined,
        reusable: reusable ? 1 : 0,
        profile_id: profileId,
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
        <div>
          <label className="block text-sm text-text-secondary mb-1">Price</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Material</label>
          <input value={material} onChange={e => setMaterial(e.target.value)} placeholder="e.g., wool, cotton, oak" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Brand</label>
          <input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Optional brand name" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input type="checkbox" checked={reusable} onChange={e => setReusable(e.target.checked)} className="rounded" />
          Reusable (tool/equipment)
        </label>
        {profiles.length > 0 && (
          <div>
            <label className="block text-sm text-text-secondary mb-1">Profile</label>
            <select value={profileId ?? ''} onChange={e => handleProfileChange(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
              <option value="">No profile</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        )}
        {schema.length > 0 && (
          <DynamicAttributeForm schema={schema} values={attributes} onChange={setAttributes} />
        )}
        {errors._ && <p className="text-xs text-error">{errors._}</p>}
        <button type="submit" disabled={createSupply.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
          {createSupply.isPending ? 'Creating...' : 'Create Supply'}
        </button>
      </form>
    </div>
  );
}
