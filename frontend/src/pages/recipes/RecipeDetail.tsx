import { useParams, Link, useNavigate } from 'react-router-dom';
import { useRecipe, useDeleteRecipe } from '@/hooks/useRecipes';
import { useCreateBrewFromRecipe } from '@/hooks/useBrews';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { formatDate, formatDuration } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function RecipeDetail() {
  const { id } = useParams();
  const recipeId = Number(id);
  const { data: recipe, isLoading, error, refetch } = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const createBrew = useCreateBrewFromRecipe();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!recipe) return <p className="text-text-muted">Recipe not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this recipe?')) return;
    await deleteRecipe.mutateAsync(recipeId);
    navigate('/recipes');
  }

  async function handleStartBrew() {
    const brew = await createBrew.mutateAsync({
      recipe_id: recipeId,
      title: `${recipe!.title} - Brew`,
    });
    navigate(`/brews/${brew.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{recipe.title}</h1>
          {recipe.craft && <p className="text-sm text-accent-light">{recipe.craft.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleStartBrew} className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-light transition-colors">
            Start a Brew
          </button>
          <Link to={`/recipes/${recipeId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">
            Edit
          </Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {recipe.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{recipe.description}</p>
            </div>
          )}

          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {recipe.duration_minutes > 0 && <span>Duration: {formatDuration(recipe.duration_minutes)}</span>}
              <span>Created: {formatDate(recipe.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="recipes" entityId={recipeId} tags={recipe.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['recipes', recipeId] })} />
          </div>
        </div>
      </div>
    </div>
  );
}
