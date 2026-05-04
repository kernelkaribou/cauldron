import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCraft, useUpdateCraft } from '@/hooks/useCrafts';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { ApiError } from '@/lib/api';

export function CraftEdit() {
  const { id } = useParams();
  const craftId = Number(id);
  const { data: craft, isLoading } = useCraft(craftId);
  const updateCraft = useUpdateCraft();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [duration, setDuration] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (craft) {
      setTitle(craft.title);
      setDescription(craft.description || '');
      setCategoryId(craft.category_id);
      setDuration(craft.duration_minutes ? String(craft.duration_minutes) : '');
    }
  }, [craft]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updateCraft.mutateAsync({
        id: craftId,
        data: { title, description: description || undefined, category_id: categoryId, duration_minutes: duration ? parseInt(duration) : 0 },
      });
      navigate(`/crafts/${craftId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Edit Craft</h1>
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
          <label className="block text-sm text-text-secondary mb-1">Category</label>
          <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Estimated Duration (minutes)</label>
          <input type="number" value={duration} onChange={e => setDuration(e.target.value)} min="0" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={updateCraft.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
            {updateCraft.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => navigate(`/crafts/${craftId}`)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
