import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSpell, useDeleteSpell } from '@/hooks/useSpells';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function SpellDetail() {
  const { id } = useParams();
  const spellId = Number(id);
  const { data: spell, isLoading, error, refetch } = useSpell(spellId);
  const deleteSpell = useDeleteSpell();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!spell) return <p className="text-text-muted">Spell not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this spell?')) return;
    await deleteSpell.mutateAsync(spellId);
    navigate('/spells');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{spell.title}</h1>
          {spell.craft && <p className="text-sm text-accent-light">{spell.craft.name}</p>}
        </div>
        <div className="flex gap-2">
          <Link to={`/spells/${spellId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {spell.content && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Content</h2>
              <div className="text-text-primary whitespace-pre-wrap">{spell.content}</div>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(spell.created_at)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="spells" entityId={spellId} tags={spell.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['spells', spellId] })} />
          </div>
        </div>
      </div>
    </div>
  );
}
