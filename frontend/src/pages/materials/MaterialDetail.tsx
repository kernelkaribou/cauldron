import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMaterial, useDeleteMaterial } from '@/hooks/useMaterials';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{material.name}</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {material.unit && <span>Unit: {material.unit}</span>}
            {material.price > 0 && <span>${material.price.toFixed(2)}</span>}
            {material.reusable ? <span className="text-accent-light">Reusable</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/materials/${materialId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {material.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{material.description}</p>
            </div>
          )}
          <PhotoGallery entityType="material" entityId={materialId} />
          <NotesSection entityType="material" entityId={materialId} />
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(material.created_at)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="materials" entityId={materialId} tags={material.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['materials', materialId] })} />
          </div>
          <VendorSection materialId={materialId} />
          <StockFeed materialId={materialId} />
        </div>
      </div>
    </div>
  );
}
