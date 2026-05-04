import { useMemo, useState } from 'react';
import { MaterialInlineForm } from '@/components/shared/MaterialInlineForm';
import { useMaterials } from '@/hooks/useMaterials';

interface MaterialPickerProps {
  selected: Array<{ mode: 'existing'; id: number; name: string; quantity?: number; unit?: string; notes?: string }>;
  onAdd: (item: { mode: 'existing'; id: number; name: string; unit?: string }) => void;
  onCreate: (item: { mode: 'new'; id: number; name: string; unit?: string }) => void;
  onRemove: (id: number) => void;
  onUpdate: (id: number, changes: { quantity?: number; unit?: string }) => void;
}

export function MaterialPicker({ selected, onAdd, onCreate, onRemove, onUpdate }: MaterialPickerProps) {
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMaterials(1, { search: search.trim() || undefined });

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

  function handleCreated(material: { id: number; name: string; unit?: string }) {
    onCreate({ mode: 'new', id: material.id, name: material.name, unit: material.unit });
    setShowCreate(false);
  }

  return (
    <section
      className={`rounded-xl border bg-card p-4 ${selected.length === 0 ? 'border-dashed border-accent/50' : 'border-border'}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-text-secondary">Materials</h2>
            <span className="text-xs text-accent">Required</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">Add at least one material for this craft.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleExisting}
            className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            {showExisting ? 'Close Search' : 'Add Existing'}
          </button>
          <button
            type="button"
            onClick={toggleCreate}
            className="rounded-lg border border-border px-3 py-2 text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
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
            placeholder="Search materials..."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />

          {isLoading && <p className="text-xs text-text-muted">Loading materials...</p>}
          {!isLoading && available.length === 0 && (
            <p className="text-xs text-text-muted">
              {search.trim() ? 'No matching materials found.' : 'No more materials available to add.'}
            </p>
          )}

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {available.slice(0, 12).map(material => (
              <button
                key={material.id}
                type="button"
                onClick={() => handleSelect(material.id, material.name, material.unit)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-card"
              >
                {material.name}
                {material.unit ? <span className="ml-1 text-text-muted">({material.unit})</span> : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {showCreate && <MaterialInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {selected.length === 0 ? (
        <p className="text-sm text-text-muted">No materials selected yet.</p>
      ) : (
        <div className="space-y-3">
          {selected.map(material => (
            <div key={material.id} className="rounded-lg border border-border bg-page p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-primary">{material.name}</p>
                  <p className="text-xs text-text-muted">Set the quantity and unit used for this craft.</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(material.id)}
                  disabled={selected.length === 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
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
                    value={material.quantity ?? ''}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '') {
                        onUpdate(material.id, { quantity: undefined });
                        return;
                      }

                      const quantity = Number(value);
                      if (!Number.isNaN(quantity)) {
                        onUpdate(material.id, { quantity });
                      }
                    }}
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-text-secondary">Unit</label>
                  <input
                    value={material.unit ?? ''}
                    onChange={e => onUpdate(material.id, { unit: e.target.value || undefined })}
                    placeholder="e.g., oz"
                    className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
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
