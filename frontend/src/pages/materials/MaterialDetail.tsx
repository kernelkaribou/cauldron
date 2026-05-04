import { useParams, useNavigate } from 'react-router-dom';
import { useMaterial, useDeleteMaterial } from '@/hooks/useMaterials';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, MetadataCard, TagsCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { StockFeed } from '@/components/shared/StockFeed';
import { VendorSection } from '@/components/shared/VendorSection';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { NotesSection } from '@/components/shared/NotesSection';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function MaterialDetail() {
  const { id } = useParams();
  const materialId = Number(id);
  const { data: material, isLoading, error, refetch } = useMaterial(materialId);
  const deleteMaterial = useDeleteMaterial();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!material) return <p className="text-text-muted">Material not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this material?')) return;
    await deleteMaterial.mutateAsync(materialId);
    navigate('/materials');
  }

  return (
    <DetailPageShell
      title={material.name}
      subtitle={<>
        {material.unit && <span>Unit: {material.unit}</span>}
        {material.price > 0 && <span>${material.price.toFixed(2)}</span>}
        {material.reusable ? <span className="text-accent-light">Reusable</span> : null}
      </>}
      editPath={`/materials/${materialId}/edit`}
      onDelete={handleDelete}
      left={<>
        {material.description && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
            <p className="text-text-primary whitespace-pre-wrap">{material.description}</p>
          </div>
        )}
        <PhotoGallery entityType="material" entityId={materialId} />
        <NotesSection entityType="material" entityId={materialId} />
      </>}
      sidebar={<>
        <MetadataCard items={[
          ...(material.unit ? [{ label: 'Unit', value: material.unit }] : []),
          ...(material.price > 0 ? [{ label: 'Price', value: `$${material.price.toFixed(2)}` }] : []),
          { label: 'Reusable', value: material.reusable ? 'Yes' : 'No' },
          { label: 'Created', value: formatDate(material.created_at) },
          { label: 'Updated', value: formatDate(material.updated_at) },
        ]} />
        <TagsCard>
          <TagSelect entityType="materials" entityId={materialId} tags={material.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['materials', materialId] })} />
        </TagsCard>
        <VendorSection materialId={materialId} />
        <StockFeed materialId={materialId} unit={material.unit} />
      </>}
    />
  );
}
