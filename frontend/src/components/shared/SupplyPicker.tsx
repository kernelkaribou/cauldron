import { useMemo, useState } from 'react';
import { SupplyInlineForm } from '@/components/shared/SupplyInlineForm';
import { useSupplies } from '@/hooks/useSupplies';
import { useSupplyTypes } from '@/hooks/useSupplyTypes';
import { getListDisplayValues } from '@/lib/utils';
import type { SupplyTypeField } from '@/lib/types';

interface SupplyPickerProps {
  selected: Array<{ mode: 'existing'; id: number; name: string; quantity?: number; unit?: string; notes?: string }>;
  onAdd: (item: { mode: 'existing'; id: number; name: string; unit?: string }) => void;
  onCreate: (item: { mode: 'new'; id: number; name: string; unit?: string }) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, changes: { quantity?: number; unit?: string }) => void;
}

export function SupplyPicker({ selected, onAdd, onCreate, onRemove, onUpdate }: SupplyPickerProps) {
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSupplies(1, { search: search.trim() || undefined });
  const { data: typesData } = useSupplyTypes(1, { per_page: '100' });

  const typeSchemas = useMemo(() => {
    const map = new Map<number, SupplyTypeField[]>();
    for (const p of typesData?.items ?? []) {
      try { map.set(p.id, JSON.parse(p.schema)); } catch { /* skip */ }
    }
    return map;
  }, [typesData]);

  const available = useMemo(() => {
    const selectedIds = new Set(selected.map(item => item.id));
    return (data?.items || []).filter(item => !selectedIds.has(item.id));
  }, [data?.items, selected]);

  function toggleExisting() {
    setShowExisting(current => !current);
    setShowCreate(false);
  }

  function toggleCreate() {
    setShowCreate(current => !current);
    setShowExisting(false);
  }

  function handleSelect(id: number, name: string, unit?: string | null) {
    onAdd({ mode: 'existing', id, name, unit: unit || undefined });
    setSearch('');
    setShowExisting(false);
  }

  function handleCreated(supply: { id: number; name: string; unit?: string }) {
    onCreate({ mode: 'new', id: supply.id, name: supply.name, unit: supply.unit });
    setShowCreate(false);
  }

  return (
    <section
      className={`rounded-xl border bg-card p-4 ${selected.length === 0 ? 'border-dashed border-accent/50' : 'border-border'}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-text-secondary">Supplies</h2>
            <span className="text-xs text-accent">Required</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">Add at least one supply for this craft.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleExisting}
            className="rounded-xl border border-border px-4 py-2.5 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
          >
            {showExisting ? 'Close Search' : 'Add Existing'}
          </button>
          <button
            type="button"
            onClick={toggleCreate}
            className="rounded-xl border border-border px-4 py-2.5 text-xs text-text-secondary transition-all hover:border-accent hover:text-accent"
          >
            {showCreate ? 'Close Form' : 'Create New'}
          </button>
        </div>
      </div>

      {showExisting && (
        <div className="mb-4 space-y-3 rounded-xl border border-border bg-page p-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search supplies..."
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
          />

          {isLoading && <p className="text-xs text-text-muted">Loading supplies...</p>}
          {!isLoading && available.length === 0 && (
            <p className="text-xs text-text-muted">
              {search.trim() ? 'No matching supplies found.' : 'No more supplies available to add.'}
            </p>
          )}

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {available.slice(0, 12).map(supply => {
              const schema = supply.type_id ? typeSchemas.get(supply.type_id) || [] : [];
              const listValues = getListDisplayValues(supply.attributes, schema);
              return (
              <button
                key={supply.id}
                type="button"
                onClick={() => handleSelect(supply.id, supply.name, supply.unit)}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-text-primary transition-all hover:bg-card"
              >
                {supply.name}
                {listValues.length > 0 && <span className="ml-1 text-text-muted">({listValues.join(', ')})</span>}
                {listValues.length === 0 && supply.unit ? <span className="ml-1 text-text-muted">({supply.unit})</span> : null}
              </button>
              );
            })}
          </div>
        </div>
      )}

      {showCreate && <SupplyInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {selected.length === 0 ? (
        <p className="text-sm text-text-muted">No supplies selected yet.</p>
      ) : (
        <div className="space-y-3">
          {selected.map(supply => (
            <div key={supply.id} className="rounded-xl border border-border bg-page p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{supply.name}</p>
                  <p className="text-xs text-text-muted">Set the quantity and unit used for this craft.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(supply.id)}
                  disabled={selected.length === 1}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={supply.quantity ?? ''}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '') {
                        onUpdate(supply.id, { quantity: undefined });
                        return;
                      }

                      const quantity = Number(value);
                      if (!Number.isNaN(quantity)) {
                        onUpdate(supply.id, { quantity });
                      }
                    }}
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Unit</label>
                  <input
                    value={supply.unit ?? ''}
                    onChange={e => onUpdate(supply.id, { unit: e.target.value || undefined })}
                    placeholder="e.g., oz"
                    className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
