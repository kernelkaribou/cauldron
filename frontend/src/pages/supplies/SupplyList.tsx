import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSupplies } from '@/hooks/useSupplies';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatDate } from '@/lib/utils';

export function SupplyList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reusable, setReusable] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useSupplies(page, { search: search || undefined, reusable });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Supplies</h1>
        <div className="flex items-center gap-3">
          <Link to="/supplies/profiles" className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent hover:text-accent transition-colors text-sm">Manage Profiles</Link>
          <Link to="/supplies/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Supply</Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search supplies..." className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none w-64" />
        <select value={reusable ?? ''} onChange={e => { setReusable(e.target.value !== '' ? Number(e.target.value) : undefined); setPage(1); }} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All types</option>
          <option value="0">Consumable</option>
          <option value="1">Reusable (Tools)</option>
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No supplies yet" actionLabel="New Supply" actionTo="/supplies/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map(supply => (
              <Link key={supply.id} to={`/supplies/${supply.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-accent hover:-translate-y-0.5 transition-all">
                <h3 className="font-medium text-text-primary mb-1">{supply.name}</h3>
                <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                  {supply.material && <span>{supply.material}</span>}
                  {supply.brand && <span>{supply.brand}</span>}
                  {supply.unit && <span>{supply.unit}</span>}
                  {supply.price > 0 && <span>${supply.price.toFixed(2)}</span>}
                  {supply.reusable ? <span className="text-accent-light">Reusable</span> : null}
                  <span>{formatDate(supply.created_at)}</span>
                </div>
                {supply.tags && supply.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {supply.tags.map(tag => <span key={tag.id} className="px-1.5 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{tag.name}</span>)}
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
