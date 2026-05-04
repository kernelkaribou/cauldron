import { Link } from 'react-router-dom';
import { useRecipes } from '@/hooks/useRecipes';
import { useBrews } from '@/hooks/useBrews';
import { useCuriosities } from '@/hooks/useCuriosities';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import type { Recipe, Brew, Curiosity } from '@/lib/types';

export function Dashboard() {
  const { data: recentRecipes } = useRecipes(1, {});
  const { data: activeBrews } = useBrews(1, {});
  const { data: recentCuriosities } = useCuriosities(1, {});

  const brewing = activeBrews?.items.filter((b: Brew) => b.status === 'gathering' || b.status === 'brewing') || [];

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Brews */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Active Brews</h2>
            <Link to="/brews" className="text-xs text-accent-light hover:text-accent">View all</Link>
          </div>
          {brewing.length === 0 && <p className="text-xs text-text-muted">No active brews.</p>}
          <div className="space-y-2">
            {brewing.slice(0, 5).map((brew: Brew) => {
              const sc = STATUS_CONFIG[brew.status];
              return (
                <Link key={brew.id} to={`/brews/${brew.id}`} className="block p-2 bg-page rounded-lg hover:border-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-text-primary truncate">{brew.title}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Recipes */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-text-secondary">Recent Recipes</h2>
            <Link to="/recipes" className="text-xs text-accent-light hover:text-accent">View all</Link>
          </div>
          {(!recentRecipes || recentRecipes.items.length === 0) && <p className="text-xs text-text-muted">No recipes yet.</p>}
          <div className="space-y-2">
            {recentRecipes?.items.slice(0, 5).map((recipe: Recipe) => (
              <Link key={recipe.id} to={`/recipes/${recipe.id}`} className="block p-2 bg-page rounded-lg hover:border-accent transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-primary truncate">{recipe.title}</span>
                  <span className="text-xs text-text-muted">{formatDate(recipe.created_at)}</span>
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
