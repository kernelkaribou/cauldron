import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useBrews } from '@/hooks/useBrews';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import type { Brew } from '@/lib/types';

export function BrewList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading, error, refetch } = useBrews(page, { status, search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Brews</h1>
        <Link to="/brews/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Brew</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search brews..." className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none w-64" />
        <select value={status ?? ''} onChange={e => { setStatus(e.target.value || undefined); setPage(1); }} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No brews yet" actionLabel="New Brew" actionTo="/brews/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map((brew: Brew) => {
              const sc = STATUS_CONFIG[brew.status];
              return (
                <Link key={brew.id} to={`/brews/${brew.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-accent hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">{brew.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                  </div>
                  {brew.recipe && <p className="text-xs text-text-secondary mb-1">From: {brew.recipe.title}</p>}
                  <p className="text-xs text-text-muted">{formatDate(brew.created_at)}</p>
                </Link>
              );
            })}
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
