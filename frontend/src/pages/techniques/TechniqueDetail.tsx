import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTechnique, useDeleteTechnique } from '@/hooks/useTechniques';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { ResourceManager } from '@/components/shared/ResourceManager';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function TechniqueDetail() {
  const { id } = useParams();
  const techniqueId = Number(id);
  const { data: technique, isLoading, error, refetch } = useTechnique(techniqueId);
  const deleteTechnique = useDeleteTechnique();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!technique) return <p className="text-text-muted">Technique not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this technique?')) return;
    await deleteTechnique.mutateAsync(techniqueId);
    navigate('/techniques');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{technique.title}</h1>
          {technique.category && <p className="text-sm text-accent-light">{technique.category.name}</p>}
        </div>
        <div className="flex gap-2">
          <Link to={`/techniques/${techniqueId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {technique.content && (
            <div className="p-4 bg-card border border-border rounded-xl prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{technique.content}</ReactMarkdown>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(technique.created_at)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="techniques" entityId={techniqueId} tags={technique.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['techniques', techniqueId] })} />
          </div>
          <ResourceManager techniqueId={techniqueId} />
        </div>
      </div>
    </div>
  );
}
