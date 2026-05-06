import { useState } from 'react';
import { SupplyInlineForm } from '@/components/shared/SupplyInlineForm';
import { SearchDropdown } from '@/components/shared/SearchDropdown';
import { useEntitySupplies, useAddEntitySupply, useRemoveEntitySupply } from '@/hooks/useSubResources';
import { useSupplies } from '@/hooks/useSupplies';

interface SupplyManagerProps {
  entityType: 'crafts' | 'projects';
  entityId: number;
}

export function SupplyManager({ entityType, entityId }: SupplyManagerProps) {
  const { data, isLoading } = useEntitySupplies(entityType, entityId);
  const addSupply = useAddEntitySupply();
  const removeSupply = useRemoveEntitySupply();
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { data: supplyResults } = useSupplies(1, { search: search || undefined });

  const attachedIds = new Set(data?.items.map(item => item.supply_id) || []);
  const available = supplyResults?.items.filter(item => !attachedIds.has(item.id)) || [];
  const canRemove = entityType !== 'crafts' || (data?.items.length ?? 0) > 1;

  async function handleAdd() {
    if (!selectedId) return;

    await addSupply.mutateAsync({
      entityType,
      entityId,
      data: {
        supply_id: selectedId,
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

  async function attachCreatedSupply(supply: { id: number; name: string; unit?: string }) {
    await addSupply.mutateAsync({
      entityType,
      entityId,
      data: {
        supply_id: supply.id,
        quantity: 0,
        unit: supply.unit,
      },
    });
    setShowCreate(false);
  }

  function handleCreated(supply: { id: number; name: string; unit?: string }) {
    void attachCreatedSupply(supply);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">Supplies</h2>
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
        <div className="mb-3 rounded-xl bg-page p-3 space-y-2">
          {!selectedId ? (
            <SearchDropdown
              placeholder="Search supplies..."
              items={available.map(s => ({ id: s.id, label: s.name, sublabel: s.unit || undefined }))}
              onSelect={item => {
                const supply = available.find(s => s.id === item.id);
                setSelectedId(item.id);
                setUnit(supply?.unit || '');
              }}
              onSearchChange={setSearch}
              emptyMessage={search ? 'No matching supplies.' : 'No more supplies available.'}
            />
          ) : (
            <>
              <p className="text-sm text-text-primary">Adding supply...</p>
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
                  className="rounded bg-accent px-3 py-1.5 text-xs text-white hover:bg-accent-dark"
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

      {showCreate && <SupplyInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No supplies attached.</p>}
      <div className="space-y-1">
        {data?.items.map(item => (
          <div key={item.supply_id} className="group flex items-center justify-between rounded-xl bg-page p-2">
            <span className="text-sm text-text-primary">
              {item.name}
              {item.quantity > 0 && <span className="ml-1 text-text-muted">({item.quantity}{item.unit ? ` ${item.unit}` : ''})</span>}
            </span>
            {canRemove ? (
              <button
                type="button"
                onClick={() => { if (confirm('Remove this supply?')) removeSupply.mutate({ entityType, entityId, supplyId: item.supply_id }); }}
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
