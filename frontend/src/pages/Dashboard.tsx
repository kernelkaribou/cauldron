import { Link } from 'react-router-dom';
import { useFormulas } from '@/hooks/useFormulas';
import { useProjects } from '@/hooks/useProjects';
import { useCuriosities } from '@/hooks/useCuriosities';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import type { Formula, Project, Curiosity } from '@/lib/types';

export function Dashboard() {
  const { data: recentFormulas } = useFormulas(1, {});
  const { data: activeProjects } = useProjects(1, {});
  const { data: recentCuriosities } = useCuriosities(1, {});

  const active = activeProjects?.items.filter((b: Project) => b.status === 'planning' || b.status === 'active') || [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Active Projects</h2>
            <Link to="/projects" className="text-xs text-accent-light hover:text-accent">View all</Link>
          </div>
          {active.length === 0 && <p className="text-xs text-text-muted">No active projects.</p>}
          <div className="space-y-2">
            {active.slice(0, 5).map((project: Project) => {
              const sc = STATUS_CONFIG[project.status];
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block p-2 bg-page rounded-lg hover:border-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary truncate">{project.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Formulas */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Recent Formulas</h2>
            <Link to="/formulas" className="text-xs text-accent-light hover:text-accent">View all</Link>
          </div>
          {(!recentFormulas || recentFormulas.items.length === 0) && <p className="text-xs text-text-muted">No formulas yet.</p>}
          <div className="space-y-2">
            {recentFormulas?.items.slice(0, 5).map((formula: Formula) => (
              <Link key={formula.id} to={`/formulas/${formula.id}`} className="block p-2 bg-page rounded-lg hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{formula.title}</span>
                  <span className="text-xs text-text-muted">{formatDate(formula.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Curiosities */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Curiosities</h2>
            <Link to="/curiosities" className="text-xs text-accent-light hover:text-accent">View all</Link>
          </div>
          {(!recentCuriosities || recentCuriosities.items.length === 0) && <p className="text-xs text-text-muted">No curiosities yet.</p>}
          <div className="space-y-2">
            {recentCuriosities?.items.slice(0, 5).map((cur: Curiosity) => (
              <Link key={cur.id} to={`/curiosities/${cur.id}`} className="block p-2 bg-page rounded-lg hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{cur.title}</span>
                  {cur.type && <span className="px-1.5 py-0.5 bg-accent-bg text-accent-light text-xs rounded">{cur.type}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
