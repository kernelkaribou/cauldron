import { useState } from 'react';
import { useEntityTechniques, useAddEntityTechnique, useRemoveEntityTechnique } from '@/hooks/useSubResources';
import { useTechniques } from '@/hooks/useTechniques';

interface TechniqueManagerProps {
  entityType: 'formulas' | 'projects';
  entityId: number;
}

export function TechniqueManager({ entityType, entityId }: TechniqueManagerProps) {
  const { data, isLoading } = useEntityTechniques(entityType, entityId);
  const addTechnique = useAddEntityTechnique();
  const removeTechnique = useRemoveEntityTechnique();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const { data: techniqueResults } = useTechniques(1, { search: search || undefined });
  const [expanded, setExpanded] = useState<number | null>(null);

  const attachedIds = new Set(data?.items.map(s => s.technique_id) || []);
  const available = techniqueResults?.items.filter(s => !attachedIds.has(s.id)) || [];

  async function handleAdd(techniqueId: number) {
    await addTechnique.mutateAsync({ entityType, entityId, data: { technique_id: techniqueId } });
    setSearch('');
    setShowAdd(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Techniques</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-accent-light hover:text-accent">{showAdd ? 'Cancel' : '+ Add Technique'}</button>
      </div>

      {showAdd && (
        <div className="mb-3 p-3 bg-page rounded-lg">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search techniques..." className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none mb-2" />
          {search && available.length === 0 && <p className="text-xs text-text-muted">No matching techniques found.</p>}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {available.slice(0, 10).map(technique => (
              <button key={technique.id} onClick={() => handleAdd(technique.id)} className="w-full text-left px-2 py-1.5 rounded text-sm text-text-primary hover:bg-card transition-colors">{technique.title}</button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No techniques attached.</p>}
      <div className="space-y-2">
        {data?.items.map(technique => (
          <div key={technique.technique_id} className="p-2 bg-page rounded-lg">
            <div className="flex items-center justify-between">
              <button onClick={() => setExpanded(expanded === technique.technique_id ? null : technique.technique_id)} className="text-sm font-medium text-text-primary hover:text-accent text-left flex-1">{technique.title}</button>
              <button onClick={() => removeTechnique.mutate({ entityType, entityId, techniqueId: technique.technique_id })} className="text-xs text-text-muted hover:text-error ml-2">×</button>
            </div>
            {technique.notes && <p className="text-xs text-text-muted mt-1">{technique.notes}</p>}
            {expanded === technique.technique_id && technique.content && (
              <div className="mt-2 text-xs text-text-secondary whitespace-pre-wrap border-t border-border pt-2">{technique.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
