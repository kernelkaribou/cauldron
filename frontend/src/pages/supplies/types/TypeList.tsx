import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { useDeleteSupplyType, useSupplyTypes } from '@/hooks/useSupplyTypes';
import { formatDate } from '@/lib/utils';

function getFieldCount(schema: string): number {
  try {
    const parsed = JSON.parse(schema);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function TypeList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useSupplyTypes(page);
  const deleteType = useDeleteSupplyType();

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete type "${name}"?`)) return;
    await deleteType.mutateAsync(id);
  }

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">Supply Types</h1>
          <p className="text-sm text-text-secondary mt-1">Create reusable field schemas for your supplies.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/supplies" className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm">Back to Supplies</Link>
          <Link to="/supplies/types/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Type</Link>
        </div>
      </div>

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No supply types yet" actionLabel="New Type" actionTo="/supplies/types/new" />}

      {data && data.items.length > 0 && (
        <>
          <div className="space-y-4">
            {data.items.map(supplyType => {
              const fieldCount = getFieldCount(supplyType.schema);

              return (
                <div key={supplyType.id} className="p-5 bg-card border border-border rounded-xl">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Link to={`/supplies/types/${supplyType.id}/edit`} className="text-lg font-medium text-text-primary hover:text-accent transition-colors">
                        {supplyType.name}
                      </Link>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-text-muted">
                        <span>{fieldCount} {fieldCount === 1 ? 'field' : 'fields'}</span>
                        <span>Created {formatDate(supplyType.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/supplies/types/${supplyType.id}/edit`} className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm">Edit</Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(supplyType.id, supplyType.name)}
                        disabled={deleteType.isPending}
                        className="px-3 py-2 border border-border rounded-lg text-text-secondary hover:border-red-500 hover:text-red-400 transition-colors text-sm disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {data.total_pages > page && (
            <div className="text-center mt-6">
              <button onClick={() => setPage(current => current + 1)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm">Load more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
