import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTechnique } from '@/hooks/useTechniques';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { ApiError } from '@/lib/api';

export function TechniqueNew() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createTechnique = useCreateTechnique();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const technique = await createTechnique.mutateAsync({ title, content: content || undefined, category_id: categoryId });
      navigate(`/techniques/${technique.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">New Technique</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Content (Markdown)</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y font-mono text-sm" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Category</label>
          <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
        </div>
        <button type="submit" disabled={createTechnique.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
          {createTechnique.isPending ? 'Creating...' : 'Create Technique'}
        </button>
      </form>
    </div>
  );
}
