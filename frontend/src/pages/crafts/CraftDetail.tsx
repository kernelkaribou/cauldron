import { useParams, useNavigate } from 'react-router-dom';
import { useCraft, useDeleteCraft } from '@/hooks/useCrafts';
import { useCreateProjectFromCraft } from '@/hooks/useProjects';
import { useAggregatedTags, type AggregatedTag } from '@/hooks/useTags';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, MetadataCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { TechniqueManager } from '@/components/shared/TechniqueManager';
import { SupplyManager } from '@/components/shared/SupplyManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LogFeed } from '@/components/shared/LogFeed';
import { NotesSection } from '@/components/shared/NotesSection';
import { formatDate, formatDuration } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

function getInheritedSourceLabel(sources: AggregatedTag['sources']) {
  const inheritedSources = sources.filter(source => source !== 'craft');
  if (inheritedSources.includes('technique') && inheritedSources.includes('supply')) return 'from techniques & supplies';
  if (inheritedSources.includes('technique')) return 'from techniques';
  return 'from supplies';
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
    !tag.sources.includes('craft') && tag.sources.some(source => source === 'technique' || source === 'supply'),
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
    const project = await createProject.mutateAsync({ craft_id: craftId, title });
    navigate(`/projects/${project.id}`);
  }

  return (
    <DetailPageShell
      title={craft.title}
      subtitle={craft.category && <p className="text-accent-light">{craft.category.name}</p>}
      editPath={`/crafts/${craftId}/edit`}
      onDelete={handleDelete}
      headerActions={
        <button onClick={handleStartProject} className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-light transition-colors">
          Start a Project
        </button>
      }
      left={<>
        {craft.description && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
            <p className="text-text-primary whitespace-pre-wrap">{craft.description}</p>
          </div>
        )}
        <TechniqueManager entityType="crafts" entityId={craftId} />
        <SupplyManager entityType="crafts" entityId={craftId} />
        <PhotoGallery entityType="craft" entityId={craftId} />
        <LogFeed craftId={craftId} />
        <NotesSection entityType="craft" entityId={craftId} />
      </>}
      sidebar={<>
        <MetadataCard items={[
          ...(craft.category ? [{ label: 'Category', value: craft.category.name }] : []),
          ...(craft.duration_minutes > 0 ? [{ label: 'Duration', value: formatDuration(craft.duration_minutes) }] : []),
          { label: 'Created', value: formatDate(craft.created_at) },
          { label: 'Updated', value: formatDate(craft.updated_at) },
        ]} />
        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
          <TagSelect entityType="crafts" entityId={craftId} tags={craft.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['crafts', craftId] })} />

          <div className="mt-4 border-t border-border pt-4">
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">From Techniques & Supplies</h3>
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
              <p className="text-xs text-text-muted">No related tags from techniques or supplies.</p>
            )}
          </div>
        </div>
      </>}
    />
  );
}
