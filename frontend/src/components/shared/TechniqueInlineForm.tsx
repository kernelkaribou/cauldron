import { useState } from 'react';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { useCreateTechnique } from '@/hooks/useTechniques';
import { ApiError } from '@/lib/api';

interface TechniqueInlineFormProps {
  onCreated: (technique: { id: number; title: string }) => void;
  onCancel: () => void;
}

export function TechniqueInlineForm({ onCreated, onCancel }: TechniqueInlineFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createTechnique = useCreateTechnique();

  async function handleSave() {
    if (!title.trim()) return;
    setErrors({});

    try {
      const technique = await createTechnique.mutateAsync({
        title: title.trim(),
        content: content.trim() || undefined,
        category_id: categoryId,
      });
      onCreated({ id: technique.id, title: technique.title });
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setErrors(err.details);
        return;
      }

      setErrors({ form: 'Unable to create technique right now.' });
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-page p-4">
      <div>
        <label className="mb-1 block text-sm text-text-secondary">Title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-text-primary focus:border-accent focus:outline-none"
        />
        {errors.title && <p className="mt-1 text-xs text-error">{errors.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-text-primary focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-text-secondary">Category</label>
        <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
      </div>

      {errors.form && <p className="text-xs text-error">{errors.form}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={createTechnique.isPending || !title.trim()}
          className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-all hover:bg-accent-dark disabled:opacity-50"
        >
          {createTechnique.isPending ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2 text-sm text-text-secondary transition-all hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
