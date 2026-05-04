import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTechniques } from '@/hooks/useTechniques';
import { useCrafts } from '@/hooks/useCrafts';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatDate } from '@/lib/utils';

export function TechniqueList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [craftId, setCraftId] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useTechniques(page, { craft_id: craftId, search: search || undefined });
  const { data: crafts } = useCrafts();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Techniques</h1>
        <Link to="/techniques/new" className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors text-sm">New Technique</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search techniques..." className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none w-64" />
        <select value={craftId ?? ''} onChange={e => { setCraftId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All crafts</option>
          {crafts?.items.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No techniques yet" actionLabel="New Technique" actionTo="/techniques/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.items.map(technique => (
              <Link key={technique.id} to={`/techniques/${technique.id}`} className="block p-4 bg-card border border-border rounded-xl hover:border-accent hover:-translate-y-0.5 transition-all">
                <h3 className="font-medium text-text-primary mb-1">{technique.title}</h3>
                {technique.craft && <p className="text-xs text-accent-light mb-2">{technique.craft.name}</p>}
                {technique.content && <p className="text-sm text-text-secondary line-clamp-2 mb-2">{technique.content}</p>}
                <p className="text-xs text-text-muted">{formatDate(technique.created_at)}</p>
                {technique.tags && technique.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {technique.tags.map(t => <span key={t.id} className="px-1.5 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{t.name}</span>)}
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
