import { useState } from 'react';
import { MaterialInlineForm } from '@/components/shared/MaterialInlineForm';
import { useEntityMaterials, useAddEntityMaterial, useRemoveEntityMaterial } from '@/hooks/useSubResources';
import { useMaterials } from '@/hooks/useMaterials';

interface MaterialManagerProps {
  entityType: 'crafts' | 'projects';
  entityId: number;
}

export function MaterialManager({ entityType, entityId }: MaterialManagerProps) {
  const { data, isLoading } = useEntityMaterials(entityType, entityId);
  const addMaterial = useAddEntityMaterial();
  const removeMaterial = useRemoveEntityMaterial();
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: materialResults } = useMaterials(1, { search: search || undefined });

  const attachedIds = new Set(data?.items.map(item => item.material_id) || []);
  const available = materialResults?.items.filter(item => !attachedIds.has(item.id)) || [];
  const canRemove = entityType !== 'crafts' || (data?.items.length ?? 0) > 1;

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
    setShowExisting(false);
  }

  async function attachCreatedMaterial(material: { id: number; name: string; unit?: string }) {
    await addMaterial.mutateAsync({
      entityType,
      entityId,
      data: {
        material_id: material.id,
        quantity: 0,
        unit: material.unit,
      },
    });
    setShowCreate(false);
  }

  function handleCreated(material: { id: number; name: string; unit?: string }) {
    void attachCreatedMaterial(material);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">Materials</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setShowExisting(current => !current);
              setShowCreate(false);
            }}
            className="text-xs text-accent-light hover:text-accent"
          >
            {showExisting ? 'Close Search' : '+ Add Existing'}
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCreate(current => !current);
              setShowExisting(false);
            }}
            className="text-xs text-accent-light hover:text-accent"
          >
            {showCreate ? 'Close Form' : '+ Create New'}
          </button>
        </div>
      </div>

      {showExisting && (
        <div className="mb-3 rounded-lg bg-page p-3 space-y-2">
          {!selectedId ? (
            <>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search materials..."
                className="w-full rounded border border-border bg-card px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
              />
              {search && available.length === 0 && <p className="text-xs text-text-muted">No matching materials.</p>}
              {!search && available.length === 0 && <p className="text-xs text-text-muted">No more materials available.</p>}
              <div className="max-h-40 space-y-1 overflow-y-auto">
                {available.slice(0, 10).map(material => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(material.id);
                      setUnit(material.unit || '');
                    }}
                    className="w-full rounded px-2 py-1.5 text-left text-sm text-text-primary transition-colors hover:bg-card"
                  >
                    {material.name}
                    {material.unit ? ` (${material.unit})` : ''}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-text-primary">Adding material...</p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  placeholder="Qty"
                  min="0"
                  step="any"
                  className="w-24 rounded border border-border bg-card px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <input
                  value={unit}
                  onChange={e => setUnit(e.target.value)}
                  placeholder="Unit"
                  className="w-28 rounded border border-border bg-card px-2 py-1.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAdd}
                  className="rounded bg-accent px-3 py-1.5 text-xs text-white hover:bg-accent-light"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="rounded border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-accent"
                >
                  Back
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {showCreate && <MaterialInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No materials attached.</p>}
      <div className="space-y-1">
        {data?.items.map(item => (
          <div key={item.material_id} className="group flex items-center justify-between rounded-lg bg-page p-2">
            <span className="text-sm text-text-primary">
              {item.name}
              {item.quantity > 0 && <span className="ml-1 text-text-muted">({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span>}
            </span>
            {canRemove ? (
              <button
                type="button"
                onClick={() => removeMaterial.mutate({ entityType, entityId, materialId: item.material_id })}
                className="text-xs text-text-muted opacity-0 transition-opacity hover:text-error group-hover:opacity-100"
              >
                ×
              </button>
            ) : (
              <span className="text-[10px] text-text-muted">Required</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
