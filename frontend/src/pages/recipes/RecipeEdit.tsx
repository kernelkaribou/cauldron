import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { CraftSelect } from '@/components/shared/CraftSelect';
import { ApiError } from '@/lib/api';

export function RecipeEdit() {
  const { id } = useParams();
  const recipeId = Number(id);
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const updateRecipe = useUpdateRecipe();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [craftId, setCraftId] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description || '');
      setCraftId(recipe.craft_id);
      setDuration(recipe.duration_minutes ? String(recipe.duration_minutes) : '');
    }
  }, [recipe]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updateRecipe.mutateAsync({
        id: recipeId,
        data: { title, description: description || undefined, craft_id: craftId, duration_minutes: duration ? parseInt(duration) : 0 },
      });
      navigate(`/recipes/${recipeId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Edit Recipe</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Craft</label>
          <CraftSelect value={craftId} onChange={setCraftId} />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Estimated Duration (minutes)</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="0" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={updateRecipe.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
            {updateRecipe.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/recipes/${recipeId}`)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
