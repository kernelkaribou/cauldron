import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupplies } from '@/hooks/useSupplies';
import { useSupplyTypes } from '@/hooks/useSupplyTypes';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { CoverThumb } from '@/components/shared/CoverThumb';
import { formatDate, getListDisplayValues } from '@/lib/utils';
import type { SupplyTypeField } from '@/lib/types';

export function SupplyList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [reusable, setReusable] = useState<number | undefined>();
  const [typeId, setTypeId] = useState<number | undefined>();
  const { data, isLoading, error, refetch } = useSupplies(page, { search: search || undefined, reusable, type_id: typeId });
  const { data: typesData } = useSupplyTypes(1, { per_page: '100' });

  const typeSchemas = useMemo(() => {
    const map = new Map<number, SupplyTypeField[]>();
    for (const p of typesData?.items ?? []) {
      try { map.set(p.id, JSON.parse(p.schema)); } catch { /* skip */ }
    }
    return map;
  }, [typesData]);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Supplies</h1>
        <div className="flex items-center gap-3">
          <Link to="/supplies/types" className="px-4 py-2.5 border border-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-all text-sm">Manage Types</Link>
          <Link to="/supplies/new" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm font-medium shadow-sm">New Supply</Link>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search supplies..." className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none w-72" />
        <select value={reusable ?? ''} onChange={e => { setReusable(e.target.value !== '' ? Number(e.target.value) : undefined); setPage(1); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All</option>
          <option value="0">Consumables</option>
          <option value="1">Tools & Equipment</option>
        </select>
        {typesData && typesData.items.length > 0 && (
          <select value={typeId ?? ''} onChange={e => { setTypeId(e.target.value !== '' ? Number(e.target.value) : undefined); setPage(1); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none">
            <option value="">All Types</option>
            {typesData.items.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No supplies yet" actionLabel="New Supply" actionTo="/supplies/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-5 space-y-5">
            {data.items.map(supply => {
              const schema = supply.type_id ? typeSchemas.get(supply.type_id) || [] : [];
              const listValues = getListDisplayValues(supply.attributes, schema);
              return (
              <Link key={supply.id} to={`/supplies/${supply.id}`} className="block bg-card border border-border rounded-2xl hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition-all break-inside-avoid overflow-hidden">
                <CoverThumb photoId={supply.cover_photo_id} alt={supply.name} className="w-full h-32 rounded-t-2xl" />
                <div className="p-4">
                  <h3 className="font-medium text-text-primary mb-1">
                    {supply.name}
                    {listValues.length > 0 && <span className="text-text-muted font-normal ml-1.5 text-sm">({listValues.join(', ')})</span>}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap mt-2">
                    {supply.brand && <span className="px-2 py-0.5 bg-card-elevated rounded-xl">{supply.brand}</span>}
                    {supply.unit && <span>{supply.unit}</span>}
                    {supply.price > 0 && <span className="text-ochre">${supply.price.toFixed(2)}</span>}
                    {supply.reusable ? <span className="text-sage">Tool</span> : null}
                    <span>{formatDate(supply.created_at)}</span>
                  </div>
                  {supply.tags && supply.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {supply.tags.map(tag => <span key={tag.id} className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-xl">{tag.name}</span>)}
                    </div>
                  )}
                </div>
              </Link>
              );
            })}
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
