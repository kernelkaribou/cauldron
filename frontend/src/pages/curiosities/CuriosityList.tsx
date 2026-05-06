import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCuriosities } from '@/hooks/useCuriosities';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { CoverThumb } from '@/components/shared/CoverThumb';
import { formatDate } from '@/lib/utils';

export function CuriosityList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string | undefined>();
  const { data, isLoading, error, refetch } = useCuriosities(page, { type, search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Curiosities</h1>
        <Link to="/curiosities/new" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm font-medium shadow-sm">New Curiosity</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search curiosities..." className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none w-72" />
        <select value={type ?? ''} onChange={e => { setType(e.target.value || undefined); setPage(1); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none">
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
          <div className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
            {data.items.map(cur => (
              <Link key={cur.id} to={`/curiosities/${cur.id}`} className="block bg-card border border-border rounded-2xl hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition-all break-inside-avoid overflow-hidden">
                <CoverThumb photoId={cur.cover_photo_id} alt={cur.title} className="w-full aspect-[4/3] rounded-t-2xl" />
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-text-primary">{cur.title}</h3>
                    <span className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-xl shrink-0 ml-2">{cur.type}</span>
                  </div>
                  {cur.description && <p className="text-sm text-text-secondary line-clamp-3 mb-2">{cur.description}</p>}
                  {cur.url && <p className="text-xs text-accent-light truncate mb-2">{cur.url}</p>}
                  <p className="text-xs text-text-muted">{formatDate(cur.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
          {data.total_pages > page && (
            <div className="text-center mt-8">
              <button onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 border border-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-all text-sm">Load more</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
