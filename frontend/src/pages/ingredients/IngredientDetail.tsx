import { useParams, Link, useNavigate } from 'react-router-dom';
import { useIngredient, useDeleteIngredient } from '@/hooks/useIngredients';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function IngredientDetail() {
  const { id } = useParams();
  const ingredientId = Number(id);
  const { data: ingredient, isLoading, error, refetch } = useIngredient(ingredientId);
  const deleteIngredient = useDeleteIngredient();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!ingredient) return <p className="text-text-muted">Ingredient not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this ingredient?')) return;
    await deleteIngredient.mutateAsync(ingredientId);
    navigate('/ingredients');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{ingredient.name}</h1>
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            {ingredient.unit && <span>Unit: {ingredient.unit}</span>}
            {ingredient.reusable ? <span className="text-accent-light">Reusable</span> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/ingredients/${ingredientId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {ingredient.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{ingredient.description}</p>
            </div>
          )}
          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(ingredient.created_at)}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="ingredients" entityId={ingredientId} tags={ingredient.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['ingredients', ingredientId] })} />
          </div>
        </div>
      </div>
    </div>
  );
}
