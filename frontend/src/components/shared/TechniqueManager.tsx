import { useState } from 'react';
import { TechniqueInlineForm } from '@/components/shared/TechniqueInlineForm';
import { SearchDropdown } from '@/components/shared/SearchDropdown';
import { useEntityTechniques, useAddEntityTechnique, useRemoveEntityTechnique } from '@/hooks/useSubResources';
import { useTechniques } from '@/hooks/useTechniques';

interface TechniqueManagerProps {
  entityType: 'crafts' | 'projects';
  entityId: number;
}

export function TechniqueManager({ entityType, entityId }: TechniqueManagerProps) {
  const { data, isLoading } = useEntityTechniques(entityType, entityId);
  const addTechnique = useAddEntityTechnique();
  const removeTechnique = useRemoveEntityTechnique();
  const [showExisting, setShowExisting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: techniqueResults } = useTechniques(1, { search: search || undefined });

  const attachedIds = new Set(data?.items.map(item => item.technique_id) || []);
  const available = techniqueResults?.items.filter(item => !attachedIds.has(item.id)) || [];
  const canRemove = entityType !== 'crafts' || (data?.items.length ?? 0) > 1;

  async function handleAdd(techniqueId: number) {
    await addTechnique.mutateAsync({ entityType, entityId, data: { technique_id: techniqueId } });
    setSearch('');
    setShowExisting(false);
  }

  async function attachCreatedTechnique(technique: { id: number; title: string }) {
    await addTechnique.mutateAsync({ entityType, entityId, data: { technique_id: technique.id } });
    setShowCreate(false);
  }

  function handleCreated(technique: { id: number; title: string }) {
    void attachCreatedTechnique(technique);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-text-secondary">Techniques</h2>
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
        <div className="mb-3 rounded-xl bg-page p-3">
          <SearchDropdown
            placeholder="Search techniques..."
            items={available.map(t => ({ id: t.id, label: t.title }))}
            onSelect={item => handleAdd(item.id)}
            onSearchChange={setSearch}
            emptyMessage={search ? 'No matching techniques found.' : 'No more techniques available.'}
          />
        </div>
      )}

      {showCreate && <TechniqueInlineForm onCreated={handleCreated} onCancel={() => setShowCreate(false)} />}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No techniques attached.</p>}
      <div className="space-y-2">
        {data?.items.map(technique => (
          <div key={technique.technique_id} className="rounded-xl bg-page p-2">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpanded(expanded === technique.technique_id ? null : technique.technique_id)}
                className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent"
              >
                {technique.title}
              </button>
              {canRemove ? (
                <button
                  type="button"
                  onClick={() => { if (confirm('Remove this technique?')) removeTechnique.mutate({ entityType, entityId, techniqueId: technique.technique_id }); }}
                  className="ml-2 text-xs text-text-muted hover:text-error"
                >
                  ×
                </button>
              ) : (
                <span className="ml-2 text-[10px] text-text-muted">Required</span>
              )}
            </div>
            {technique.notes && <p className="mt-1 text-xs text-text-muted">{technique.notes}</p>}
            {expanded === technique.technique_id && technique.content && (
              <div className="mt-2 border-t border-border pt-2 text-xs whitespace-pre-wrap text-text-secondary">
                {technique.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
