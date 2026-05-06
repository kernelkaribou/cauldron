import { Link } from 'react-router-dom';
import { useCrafts } from '@/hooks/useCrafts';
import { useProjects } from '@/hooks/useProjects';
import { useCuriosities } from '@/hooks/useCuriosities';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import type { Craft, Project, Curiosity } from '@/lib/types';

export function Dashboard() {
  const { data: recentCrafts } = useCrafts(1, {});
  const { data: activeProjects } = useProjects(1, {});
  const { data: recentCuriosities } = useCuriosities(1, {});

  const active = activeProjects?.items.filter((b: Project) => b.status === 'planning' || b.status === 'active') || [];

  return (
    <div>
      <h1 className="text-3xl font-semibold text-text-primary mb-2">Welcome back</h1>
      <p className="text-text-muted mb-8">What are we making today?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Active Projects */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-text-primary">Active Projects</h2>
            <Link to="/projects" className="text-xs text-accent-light hover:text-accent">View all →</Link>
          </div>
          {active.length === 0 && <p className="text-sm text-text-muted">No active projects.</p>}
          <div className="space-y-2">
            {active.slice(0, 5).map((project: Project) => {
              const sc = STATUS_CONFIG[project.status];
              return (
                <Link key={project.id} to={`/projects/${project.id}`} className="block p-3 bg-page rounded-xl hover:bg-card-elevated transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary truncate">{project.title}</span>
                    <span className={`px-2 py-0.5 rounded-xl text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Crafts */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-text-primary">Recent Crafts</h2>
            <Link to="/crafts" className="text-xs text-accent-light hover:text-accent">View all →</Link>
          </div>
          {(!recentCrafts || recentCrafts.items.length === 0) && <p className="text-sm text-text-muted">No crafts yet.</p>}
          <div className="space-y-2">
            {recentCrafts?.items.slice(0, 5).map((craft: Craft) => (
              <Link key={craft.id} to={`/crafts/${craft.id}`} className="block p-3 bg-page rounded-xl hover:bg-card-elevated transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{craft.title}</span>
                  <span className="text-xs text-text-muted">{formatDate(craft.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Curiosities */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-text-primary">Curiosities</h2>
            <Link to="/curiosities" className="text-xs text-accent-light hover:text-accent">View all →</Link>
          </div>
          {(!recentCuriosities || recentCuriosities.items.length === 0) && <p className="text-sm text-text-muted">No curiosities yet.</p>}
          <div className="space-y-2">
            {recentCuriosities?.items.slice(0, 5).map((cur: Curiosity) => (
              <Link key={cur.id} to={`/curiosities/${cur.id}`} className="block p-3 bg-page rounded-xl hover:bg-card-elevated transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{cur.title}</span>
                  {cur.type && <span className="px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-xl">{cur.type}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
