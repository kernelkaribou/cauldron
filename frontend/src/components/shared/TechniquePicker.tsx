import { useMemo, useState } from 'react';
import { TechniqueInlineForm } from '@/components/shared/TechniqueInlineForm';
import { useTechniques } from '@/hooks/useTechniques';

interface TechniquePickerProps {
  selected: Array<{ mode: 'existing'; id: number; title: string; sort_order?: number; notes?: string }>;
  onAdd: (item: { mode: 'existing'; id: number; title: string }) => void;
  onCreate: (item: { mode: 'new'; id: number; title: string }) => void;
  onRemove: (id: number) => void;
}

export function TechniquePicker({ selected, onAdd, onCreate, onRemove }: TechniquePickerProps) {
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const { data, isLoading } = useTechniques(1, { search: search.trim() || undefined });

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

  function handleSelect(id: number, title: string) {
    onAdd({ mode: 'existing', id, title });
    setSearch('');
    setShowExisting(false);
  }

  function handleCreated(technique: { id: number; title: string }) {
    onCreate({ mode: 'new', id: technique.id, title: technique.title });
    setShowCreate(false);
  }

  return (
    <section
      className={`rounded-xl border bg-card p-4 ${selected.length === 0 ? 'border-dashed border-accent/50' : 'border-border'}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-text-secondary">Techniques</h2>
            <span className="text-xs text-accent">Required</span>
          </div>
          <p className="mt-1 text-xs text-text-muted">Add at least one technique for this craft.</p>
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
            placeholder="Search techniques..."
            className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
          />

          {isLoading && <p className="text-xs text-text-muted">Loading techniques...</p>}
          {!isLoading && available.length === 0 && (
            <p className="text-xs text-text-muted">
              {search.trim() ? 'No matching techniques found.' : 'No more techniques available to add.'}
            </p>
          )}

          <div className="max-h-48 space-y-1 overflow-y-auto">
            {available.slice(0, 12).map(technique => (
              <button
                key={technique.id}
                type="button"
                onClick={() => handleSelect(technique.id, technique.title)}
                className="w-full rounded-lg px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-card"
              >
                {technique.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {showCreate && <TechniqueInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {selected.length === 0 ? (
        <p className="text-sm text-text-muted">No techniques selected yet.</p>
      ) : (
        <div className="space-y-2">
          {selected.map((technique, index) => (
            <div key={technique.id} className="flex items-center justify-between rounded-lg border border-border bg-page p-3">
              <div>
                <p className="text-sm font-medium text-text-primary">{technique.title}</p>
                <p className="text-xs text-text-muted">Sort order: {index + 1}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(technique.id)}
                disabled={selected.length === 1}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-error hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
