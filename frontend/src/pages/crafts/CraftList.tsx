import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCrafts } from '@/hooks/useCrafts';
import { useCategories } from '@/hooks/useCategories';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { CoverThumb } from '@/components/shared/CoverThumb';
import { formatDate, formatDuration } from '@/lib/utils';

export function CraftList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useCrafts(page, { category_id: categoryId, search: search || undefined });
  const { data: categories } = useCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Crafts</h1>
        <Link to="/crafts/new" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm font-medium shadow-sm">
          New Craft
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search crafts..."
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none w-72"
        />
        <select
          value={categoryId ?? ''}
          onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }}
          className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none"
        >
          <option value="">All categories</option>
          {categories?.items.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>

      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}

      {data && data.items.length === 0 && (
        <EmptyState title="No crafts yet" description="Create your first craft to get started." actionLabel="New Craft" actionTo="/crafts/new" />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5 space-y-5">
            {data.items.map(craft => (
              <Link
                key={craft.id}
                to={`/crafts/${craft.id}`}
                className="block bg-card border border-border rounded-2xl hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition-all break-inside-avoid overflow-hidden"
              >
                <CoverThumb photoId={craft.cover_photo_id} alt={craft.title} className="w-full h-32 rounded-t-2xl" />
                <div className="p-4">
                  <h3 className="font-medium text-text-primary mb-1">{craft.title}</h3>
                  {craft.category && <p className="text-xs text-accent-light mb-2">{craft.category.name}</p>}
                  {craft.description && <p className="text-sm text-text-secondary line-clamp-3 mb-2">{craft.description}</p>}
                  <div className="flex items-center gap-3 text-xs text-text-muted">
                    {craft.duration_minutes > 0 && <span>{formatDuration(craft.duration_minutes)}</span>}
                    <span>{formatDate(craft.created_at)}</span>
                  </div>
                  {craft.tags && craft.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {craft.tags.map(tag => <span key={tag.id} className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-xl">{tag.name}</span>)}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {data.total_pages > page && (
            <div className="text-center mt-8">
              <button onClick={() => setPage(p => p + 1)} className="px-5 py-2.5 border border-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-all text-sm">
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
