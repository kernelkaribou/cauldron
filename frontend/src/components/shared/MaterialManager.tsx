import { useState } from 'react';
import { useEntityMaterials, useAddEntityMaterial, useRemoveEntityMaterial } from '@/hooks/useSubResources';
import { useMaterials } from '@/hooks/useMaterials';

interface MaterialManagerProps {
  entityType: 'formulas' | 'projects';
  entityId: number;
}

export function MaterialManager({ entityType, entityId }: MaterialManagerProps) {
  const { data, isLoading } = useEntityMaterials(entityType, entityId);
  const addMaterial = useAddEntityMaterial();
  const removeMaterial = useRemoveEntityMaterial();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: materialResults } = useMaterials(1, { search: search || undefined });

  const attachedIds = new Set(data?.items.map(i => i.material_id) || []);
  const available = materialResults?.items.filter(i => !attachedIds.has(i.id)) || [];

  async function handleAdd() {
    if (!selectedId) return;
    await addMaterial.mutateAsync({
      entityType,
      entityId,
      data: {
        material_id: selectedId,
        quantity: quantity ? parseFloat(quantity) : 0,
        unit: unit || undefined,
      },
    });
    setSelectedId(null);
    setQuantity('');
    setUnit('');
    setSearch('');
    setShowAdd(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Materials</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-accent-light hover:text-accent">{showAdd ? 'Cancel' : '+ Add'}</button>
      </div>

      {showAdd && (
        <div className="mb-3 p-3 bg-page rounded-lg space-y-2">
          {!selectedId ? (
            <>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materials..." className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
              {search && available.length === 0 && <p className="text-xs text-text-muted">No matching materials.</p>}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {available.slice(0, 10).map(ing => (
                  <button key={ing.id} onClick={() => { setSelectedId(ing.id); setUnit(ing.unit || ''); }} className="w-full text-left px-2 py-1.5 rounded text-sm text-text-primary hover:bg-card transition-colors">
                    {ing.name}{ing.unit ? ` (${ing.unit})` : ''}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-text-primary">Adding material...</p>
              <div className="flex gap-2">
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Qty" min="0" step="any" className="w-20 px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
                <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="Unit" className="w-24 px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
                <button onClick={handleAdd} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light">Add</button>
                <button onClick={() => setSelectedId(null)} className="px-3 py-1.5 border border-border rounded text-xs text-text-secondary hover:border-accent">Back</button>
              </div>
            </>
          )}
        </div>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No materials attached.</p>}
      <div className="space-y-1">
        {data?.items.map(item => (
          <div key={item.material_id} className="flex items-center justify-between p-2 bg-page rounded-lg group">
            <span className="text-sm text-text-primary">
              {item.name}
              {item.quantity > 0 && <span className="text-text-muted ml-1">({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span>}
            </span>
            <button onClick={() => removeMaterial.mutate({ entityType, entityId, materialId: item.material_id })} className="text-xs text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
