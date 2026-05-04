import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCuriosities } from '@/hooks/useCuriosities';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatDate } from '@/lib/utils';

export function CuriosityList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | undefined>();
  const { data, isLoading, error, refetch } = useCuriosities(page, { type, search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Curiosities</h1>
        <Link to="/curiosities/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Curiosity</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search curiosities..." className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none w-64" />
        <select value={type ?? ''} onChange={e => { setType(e.target.value || undefined); setPage(1); }} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All types</option>
          <option value="link">Link</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="article">Article</option>
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No curiosities yet" actionLabel="New Curiosity" actionTo="/curiosities/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map(cur => (
              <Link key={cur.id} to={`/curiosities/${cur.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-accent hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-text-primary truncate">{cur.title}</h3>
                  <span className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{cur.type}</span>
                </div>
                {cur.url && <p className="text-xs text-accent-light truncate mb-1">{cur.url}</p>}
                <p className="text-xs text-text-muted">{formatDate(cur.created_at)}</p>
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
