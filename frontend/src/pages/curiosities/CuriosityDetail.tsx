import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCuriosity, useDeleteCuriosity } from '@/hooks/useCuriosities';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function CuriosityDetail() {
  const { id } = useParams();
  const curiosityId = Number(id);
  const { data: curiosity, isLoading, error, refetch } = useCuriosity(curiosityId);
  const deleteCuriosity = useDeleteCuriosity();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!curiosity) return <p className="text-text-muted">Curiosity not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this curiosity?')) return;
    await deleteCuriosity.mutateAsync(curiosityId);
    navigate('/curiosities');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{curiosity.title}</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
            {curiosity.type && <span className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{curiosity.type}</span>}
            {curiosity.category && <span>{curiosity.category.name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/curiosities/${curiosityId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-4 bg-card border border-border rounded-xl">
            <a href={curiosity.url} target="_blank" rel="noopener noreferrer" className="text-accent-light hover:text-accent underline break-all">{curiosity.url}</a>
          </div>
          {curiosity.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{curiosity.description}</p>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(curiosity.created_at)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="curiosities" entityId={curiosityId} tags={curiosity.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['curiosities', curiosityId] })} />
          </div>
        </div>
      </div>
    </div>
  );
}
