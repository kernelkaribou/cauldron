import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTechnique } from '@/hooks/useTechniques';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
import { ApiError } from '@/lib/api';
import type { Technique } from '@/lib/types';

export function TechniqueNew() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Technique['difficulty']>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createTechnique = useCreateTechnique();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const technique = await createTechnique.mutateAsync({ title, content: content || undefined, category_id: categoryId, difficulty });
      navigate(`/techniques/${technique.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <EntityFormShell title="New Technique" onSubmit={handleSubmit} submitLabel="Create Technique" submitting={createTechnique.isPending}>
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Content (Markdown)">
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y font-mono text-sm" />
      </FormField>
      <FormField label="Difficulty">
        <select value={difficulty ?? ''} onChange={e => setDifficulty((e.target.value || null) as Technique['difficulty'])} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
          <option value="">Not set</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </FormField>
      <FormField label="Category">
        <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
      </FormField>
    </EntityFormShell>
  );
}
