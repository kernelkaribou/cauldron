import { useState } from 'react';
import { useEntitySpells, useAddEntitySpell, useRemoveEntitySpell } from '@/hooks/useSubResources';
import { useSpells } from '@/hooks/useSpells';

interface SpellManagerProps {
  entityType: 'recipes' | 'brews';
  entityId: number;
}

export function SpellManager({ entityType, entityId }: SpellManagerProps) {
  const { data, isLoading } = useEntitySpells(entityType, entityId);
  const addSpell = useAddEntitySpell();
  const removeSpell = useRemoveEntitySpell();
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const { data: spellResults } = useSpells(1, { search: search || undefined });
  const [expanded, setExpanded] = useState<number | null>(null);

  const attachedIds = new Set(data?.items.map(s => s.spell_id) || []);
  const available = spellResults?.items.filter(s => !attachedIds.has(s.id)) || [];

  async function handleAdd(spellId: number) {
    await addSpell.mutateAsync({ entityType, entityId, data: { spell_id: spellId } });
    setSearch('');
    setShowAdd(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Spells</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs text-accent-light hover:text-accent">{showAdd ? 'Cancel' : '+ Add Spell'}</button>
      </div>

      {showAdd && (
        <div className="mb-3 p-3 bg-page rounded-lg">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search spells..." className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none mb-2" />
          {search && available.length === 0 && <p className="text-xs text-text-muted">No matching spells found.</p>}
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {available.slice(0, 10).map(spell => (
              <button key={spell.id} onClick={() => handleAdd(spell.id)} className="w-full text-left px-2 py-1.5 rounded text-sm text-text-primary hover:bg-card transition-colors">{spell.title}</button>
            ))}
          </div>
        </div>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No spells attached.</p>}
      <div className="space-y-2">
        {data?.items.map(spell => (
          <div key={spell.spell_id} className="p-2 bg-page rounded-lg">
            <div className="flex items-center justify-between">
              <button onClick={() => setExpanded(expanded === spell.spell_id ? null : spell.spell_id)} className="text-sm font-medium text-text-primary hover:text-accent text-left flex-1">{spell.title}</button>
              <button onClick={() => removeSpell.mutate({ entityType, entityId, spellId: spell.spell_id })} className="text-xs text-text-muted hover:text-error ml-2">×</button>
            </div>
            {spell.notes && <p className="text-xs text-text-muted mt-1">{spell.notes}</p>}
            {expanded === spell.spell_id && spell.content && (
              <div className="mt-2 text-xs text-text-secondary whitespace-pre-wrap border-t border-border pt-2">{spell.content}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
