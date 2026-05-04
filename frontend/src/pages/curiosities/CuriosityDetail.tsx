import { useParams, useNavigate } from 'react-router-dom';
import { useCuriosity, useDeleteCuriosity } from '@/hooks/useCuriosities';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, MetadataCard, TagsCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { NotesSection } from '@/components/shared/NotesSection';
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
    <DetailPageShell
      title={curiosity.title}
      subtitle={<>
        {curiosity.type && <span className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{curiosity.type}</span>}
        {curiosity.category && <span>{curiosity.category.name}</span>}
      </>}
      editPath={`/curiosities/${curiosityId}/edit`}
      onDelete={handleDelete}
      left={<>
        <div className="p-4 bg-card border border-border rounded-xl">
          <a href={curiosity.url} target="_blank" rel="noopener noreferrer" className="text-accent-light hover:text-accent underline break-all">{curiosity.url}</a>
        </div>
        {curiosity.description && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
            <p className="text-text-primary whitespace-pre-wrap">{curiosity.description}</p>
          </div>
        )}
        <NotesSection entityType="curiosity" entityId={curiosityId} />
        <PhotoGallery entityType="curiosity" entityId={curiosityId} />
      </>}
      sidebar={<>
        <MetadataCard items={[
          ...(curiosity.type ? [{ label: 'Type', value: <span className="capitalize">{curiosity.type}</span> }] : []),
          ...(curiosity.category ? [{ label: 'Category', value: curiosity.category.name }] : []),
          { label: 'Created', value: formatDate(curiosity.created_at) },
          { label: 'Updated', value: formatDate(curiosity.updated_at) },
        ]} />
        <TagsCard>
          <TagSelect entityType="curiosities" entityId={curiosityId} tags={curiosity.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['curiosities', curiosityId] })} />
        </TagsCard>
      </>}
    />
  );
}
