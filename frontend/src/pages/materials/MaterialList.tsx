import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaterials } from '@/hooks/useMaterials';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatDate } from '@/lib/utils';

export function MaterialList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reusable, setReusable] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useMaterials(page, { search: search || undefined, reusable });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Materials</h1>
        <Link to="/materials/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Material</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search materials..." className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none w-64" />
        <select value={reusable ?? ''} onChange={e => { setReusable(e.target.value !== '' ? Number(e.target.value) : undefined); setPage(1); }} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All types</option>
          <option value="0">Consumable</option>
          <option value="1">Reusable (Tools)</option>
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No materials yet" actionLabel="New Material" actionTo="/materials/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map(material => (
              <Link key={material.id} to={`/materials/${material.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-accent hover:-translate-y-0.5 transition-all">
                <h3 className="font-medium text-text-primary mb-1">{material.name}</h3>
                <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                  {material.unit && <span>{material.unit}</span>}
                  {material.price > 0 && <span>${material.price.toFixed(2)}</span>}
                  {material.reusable ? <span className="text-accent-light">Reusable</span> : null}
                  <span>{formatDate(material.created_at)}</span>
                </div>
                {material.tags && material.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {material.tags.map(tag => <span key={tag.id} className="px-1.5 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{tag.name}</span>)}
                  </div>
                )}
              </Link>
            ))}
          </div>
          {data.total_pages > page && (
            <div className="text-center mt-6">
              <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm">Load more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
