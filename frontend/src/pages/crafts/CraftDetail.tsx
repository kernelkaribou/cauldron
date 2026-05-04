import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCraft, useDeleteCraft } from '@/hooks/useCrafts';
import { useCreateProjectFromCraft } from '@/hooks/useProjects';
import { useAggregatedTags, type AggregatedTag } from '@/hooks/useTags';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { TechniqueManager } from '@/components/shared/TechniqueManager';
import { MaterialManager } from '@/components/shared/MaterialManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LogFeed } from '@/components/shared/LogFeed';
import { NotesSection } from '@/components/shared/NotesSection';
import { formatDate, formatDuration } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

function getInheritedSourceLabel(sources: AggregatedTag['sources']) {
  const inheritedSources = sources.filter(source => source !== 'craft');

  if (inheritedSources.includes('technique') && inheritedSources.includes('material')) {
    return 'from techniques & materials';
  }

  if (inheritedSources.includes('technique')) {
    return 'from techniques';
  }

  return 'from materials';
}

export function CraftDetail() {
  const { id } = useParams();
  const craftId = Number(id);
  const { data: craft, isLoading, error, refetch } = useCraft(craftId);
  const { data: aggregatedTags, isLoading: isLoadingAggregatedTags, error: aggregatedTagsError } = useAggregatedTags(craftId);
  const deleteCraft = useDeleteCraft();
  const createProject = useCreateProjectFromCraft();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!craft) return <p className="text-text-muted">Craft not found</p>;

  const relatedTags = (aggregatedTags?.items || []).filter(tag =>
    !tag.sources.includes('craft') && tag.sources.some(source => source === 'technique' || source === 'material'),
  );

  async function handleDelete() {
    if (!confirm('Delete this craft?')) return;
    await deleteCraft.mutateAsync(craftId);
    navigate('/crafts');
  }

  async function handleStartProject() {
    if (!craft) return;

    const title = prompt('Project title:', `${craft.title} - Project`);
    if (!title) return;

    const project = await createProject.mutateAsync({
      craft_id: craftId,
      title,
    });
    navigate(`/projects/${project.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{craft.title}</h1>
          {craft.category && <p className="text-sm text-accent-light">{craft.category.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleStartProject} className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-light transition-colors">
            Start a Project
          </button>
          <Link to={`/crafts/${craftId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">
            Edit
          </Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {craft.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{craft.description}</p>
            </div>
          )}

          <TechniqueManager entityType="crafts" entityId={craftId} />
          <MaterialManager entityType="crafts" entityId={craftId} />
          <PhotoGallery entityType="craft" entityId={craftId} />
          <LogFeed craftId={craftId} />
          <NotesSection entityType="craft" entityId={craftId} />

          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {craft.duration_minutes > 0 && <span>Duration: {formatDuration(craft.duration_minutes)}</span>}
              <span>Created: {formatDate(craft.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="crafts" entityId={craftId} tags={craft.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['crafts', craftId] })} />

            <div className="mt-4 border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">From Techniques & Materials</h3>
              {aggregatedTagsError ? (
                <p className="text-xs text-error">Unable to load related tags.</p>
              ) : isLoadingAggregatedTags ? (
                <p className="text-xs text-text-muted">Loading related tags...</p>
              ) : relatedTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {relatedTags.map(tag => (
                    <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-page px-2 py-0.5 text-xs text-text-muted">
                      <span className="text-text-secondary">{tag.name}</span>
                      <span className="rounded-full bg-card px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-text-muted">
                        {getInheritedSourceLabel(tag.sources)}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-text-muted">No related tags from techniques or materials.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
