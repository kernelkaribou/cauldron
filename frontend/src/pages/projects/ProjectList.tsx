import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { CoverThumb } from '@/components/shared/CoverThumb';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate, pluralize } from '@/lib/utils';
import type { Project } from '@/lib/types';

export function ProjectList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const { data, isLoading, error, refetch } = useProjects(page, { status, search: search || undefined });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Projects</h1>
        <Link to="/projects/new" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all text-sm font-medium shadow-sm">New Project</Link>
      </div>
      <div className="flex flex-wrap gap-3 mb-8">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects..." className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none w-72" />
        <select value={status ?? ''} onChange={e => { setStatus(e.target.value || undefined); setPage(1); }} className="px-4 py-2.5 bg-card border border-border rounded-xl text-text-primary text-sm focus:border-accent focus:outline-none">
          <option value="">All statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      {error && <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />}
      {isLoading && <p className="text-text-muted">Loading...</p>}
      {data && data.items.length === 0 && <EmptyState title="No projects yet" actionLabel="New Project" actionTo="/projects/new" />}
      {data && data.items.length > 0 && (
        <>
          <div className="columns-2 md:columns-3 xl:columns-4 gap-4 space-y-4">
            {data.items.map((project: Project) => {
              const sc = STATUS_CONFIG[project.status];
              const craftCount = project.crafts?.length || 0;

              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block bg-card border border-border rounded-2xl hover:border-accent hover:-translate-y-0.5 hover:shadow-md transition-all overflow-hidden break-inside-avoid">
                  <CoverThumb photoId={project.cover_photo_id} alt={project.title} className="w-full aspect-[4/3] rounded-t-2xl" />
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-text-primary">{project.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-xl text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                    </div>
                    {project.description && <p className="text-sm text-text-secondary line-clamp-2 mb-2">{project.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-text-muted">
                      {craftCount > 0 && <span>{craftCount} {pluralize(craftCount, 'craft')}</span>}
                      {project.due_date && <span className="text-ochre">Due: {formatDate(project.due_date)}</span>}
                      <span>{formatDate(project.created_at)}</span>
                    </div>
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
