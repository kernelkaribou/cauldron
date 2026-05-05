import { useParams, useNavigate } from 'react-router-dom';
import { useSupply, useDeleteSupply } from '@/hooks/useSupplies';
import { useSupplyType } from '@/hooks/useSupplyTypes';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, MetadataCard, TagsCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { StockFeed } from '@/components/shared/StockFeed';
import { VendorSection } from '@/components/shared/VendorSection';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { NotesSection } from '@/components/shared/NotesSection';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { SupplyTypeField } from '@/lib/types';

export function SupplyDetail() {
  const { id } = useParams();
  const supplyId = Number(id);
  const { data: supply, isLoading, error, refetch } = useSupply(supplyId);
  const deleteSupply = useDeleteSupply();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: supplyType } = useSupplyType(supply?.type_id ?? 0);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!supply) return <p className="text-text-muted">Supply not found</p>;

  const attrs: Record<string, any> = supply.attributes ? JSON.parse(supply.attributes) : {};
  const schema: SupplyTypeField[] = supplyType?.schema ? JSON.parse(supplyType.schema) : [];

  async function handleDelete() {
    if (!confirm('Delete this supply?')) return;
    await deleteSupply.mutateAsync(supplyId);
    navigate('/supplies');
  }

  return (
    <DetailPageShell
      title={supply.name}
      subtitle={<>
        {supply.brand && <span>Brand: {supply.brand}</span>}
        {supply.unit && <span>Unit: {supply.unit}</span>}
        {supply.price > 0 && <span>${supply.price.toFixed(2)}</span>}
        {supply.reusable ? <span className="text-accent-light">Reusable</span> : null}
      </>}
      editPath={`/supplies/${supplyId}/edit`}
      onDelete={handleDelete}
      left={<>
        {supply.description && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
            <p className="text-text-primary whitespace-pre-wrap">{supply.description}</p>
          </div>
        )}
        {Object.keys(attrs).length > 0 && schema.length > 0 && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">
              {supplyType?.name ?? 'Type'} Attributes
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {schema.map(field => {
                const val = attrs[field.key];
                if (val === undefined || val === null) return null;
                let display: string;
                if (Array.isArray(val)) display = val.join(', ');
                else if (typeof val === 'boolean') display = val ? 'Yes' : 'No';
                else display = String(val) + (field.unit ? ` ${field.unit}` : '');
                return (
                  <div key={field.key}>
                    <dt className="text-text-muted">{field.label}</dt>
                    <dd className="text-text-primary font-medium">{display}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        )}
        <PhotoGallery entityType="supply" entityId={supplyId} />
        <NotesSection entityType="supply" entityId={supplyId} />
      </>}
      sidebar={<>
        <MetadataCard items={[
          ...(supply.brand ? [{ label: 'Brand', value: supply.brand }] : []),
          ...(supply.unit ? [{ label: 'Unit', value: supply.unit }] : []),
          ...(supply.price > 0 ? [{ label: 'Price', value: `$${supply.price.toFixed(2)}` }] : []),
          { label: 'Reusable', value: supply.reusable ? 'Yes' : 'No' },
          ...(supplyType ? [{ label: 'Type', value: supplyType.name }] : []),
          { label: 'Created', value: formatDate(supply.created_at) },
          { label: 'Updated', value: formatDate(supply.updated_at) },
        ]} />
        <TagsCard>
          <TagSelect entityType="supplies" entityId={supplyId} tags={supply.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['supplies', supplyId] })} />
        </TagsCard>
        <VendorSection supplyId={supplyId} />
        <StockFeed supplyId={supplyId} unit={supply.unit} />
      </>}
    />
  );
}
