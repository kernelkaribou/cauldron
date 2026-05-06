import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTechniques } from '@/hooks/useTechniques';
import { useCategories } from '@/hooks/useCategories';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { formatDate } from '@/lib/utils';

export function TechniqueList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useTechniques(page, { category_id: categoryId, search: search || undefined });
  const { data: categories } = useCategories();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Techniques</h1>
        <Link to="/techniques/new" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm font-medium shadow-sm">New Technique</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search techniques..." className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none w-72" />
        <select value={categoryId ?? ''} onChange={e => { setCategoryId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All categories</option>
          {categories?.items.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No techniques yet" actionLabel="New Technique" actionTo="/techniques/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="columns-1 md:columns-2 xl:columns-3 gap-5 space-y-5">
            {data.items.map(technique => (
              <Link key={technique.id} to={`/techniques/${technique.id}`} className="block p-5 bg-card border border-border rounded-2xl hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition-all break-inside-avoid">
                <h3 className="font-medium text-text-primary mb-1">{technique.title}</h3>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {technique.category && <span className="text-xs text-accent-light">{technique.category.name}</span>}
                  {technique.difficulty && <span className="px-2 py-0.5 bg-card-elevated border border-border-subtle text-text-secondary text-xs rounded-xl capitalize">{technique.difficulty}</span>}
                </div>
                {technique.content && <p className="text-sm text-text-secondary line-clamp-3 mb-2">{technique.content}</p>}
                <p className="text-xs text-text-muted">{formatDate(technique.created_at)}</p>
                {technique.tags && technique.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {technique.tags.map(tag => <span key={tag.id} className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-xl">{tag.name}</span>)}
                  </div>
                )}
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
