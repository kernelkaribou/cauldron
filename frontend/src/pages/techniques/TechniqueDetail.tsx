import { useParams, useNavigate } from 'react-router-dom';
import { useTechnique, useDeleteTechnique } from '@/hooks/useTechniques';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, MetadataCard, TagsCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { ResourceManager } from '@/components/shared/ResourceManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { NotesSection } from '@/components/shared/NotesSection';
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
    <DetailPageShell
      title={technique.title}
      subtitle={<>
        {technique.category && <p className="text-accent-light">{technique.category.name}</p>}
        {technique.difficulty && <span className="px-2 py-0.5 bg-page border border-border text-xs rounded capitalize">{technique.difficulty}</span>}
      </>}
      editPath={`/techniques/${techniqueId}/edit`}
      onDelete={handleDelete}
      left={<>
        {technique.content && (
          <div className="p-4 bg-card border border-border rounded-xl prose prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{technique.content}</ReactMarkdown>
          </div>
        )}
        <PhotoGallery entityType="technique" entityId={techniqueId} />
        <NotesSection entityType="technique" entityId={techniqueId} />
      </>}
      sidebar={<>
        <MetadataCard items={[
          ...(technique.category ? [{ label: 'Category', value: technique.category.name }] : []),
          ...(technique.difficulty ? [{ label: 'Difficulty', value: <span className="capitalize">{technique.difficulty}</span> }] : []),
          { label: 'Created', value: formatDate(technique.created_at) },
          { label: 'Updated', value: formatDate(technique.updated_at) },
        ]} />
        <TagsCard>
          <TagSelect entityType="techniques" entityId={techniqueId} tags={technique.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['techniques', techniqueId] })} />
        </TagsCard>
        <ResourceManager techniqueId={techniqueId} />
      </>}
    />
  );
}
