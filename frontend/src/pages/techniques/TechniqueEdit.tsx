import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTechnique, useUpdateTechnique } from '@/hooks/useTechniques';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
import { ApiError } from '@/lib/api';
import type { Technique } from '@/lib/types';

export function TechniqueEdit() {
  const { id } = useParams();
  const techniqueId = Number(id);
  const { data: technique, isLoading } = useTechnique(techniqueId);
  const updateTechnique = useUpdateTechnique();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [difficulty, setDifficulty] = useState<Technique['difficulty']>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (technique) {
      setTitle(technique.title);
      setContent(technique.content || '');
      setCategoryId(technique.category_id);
      setDifficulty(technique.difficulty);
    }
  }, [technique]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updateTechnique.mutateAsync({ id: techniqueId, data: { title, content: content || undefined, category_id: categoryId, difficulty } });
      navigate(`/techniques/${techniqueId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <EntityFormShell title="Edit Technique" onSubmit={handleSubmit} submitLabel="Save Changes" submitting={updateTechnique.isPending} onCancel={() => navigate(`/techniques/${techniqueId}`)}>
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Content (Markdown)">
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none resize-y font-mono text-sm" />
      </FormField>
      <FormField label="Difficulty">
        <select value={difficulty ?? ''} onChange={e => setDifficulty((e.target.value || null) as Technique['difficulty'])} className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none">
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
