import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCuriosity } from '@/hooks/useCuriosities';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
import { ApiError } from '@/lib/api';

export function CuriosityNew() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('link');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCuriosity = useCreateCuriosity();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const curiosity = await createCuriosity.mutateAsync({
        title,
        type,
        description: description || undefined,
        url,
        category_id: categoryId,
      });
      navigate(`/curiosities/${curiosity.id}`);
    } catch (err) { if (err instanceof ApiError && err.details) setErrors(err.details); }
  }

  return (
    <EntityFormShell title="New Curiosity" onSubmit={handleSubmit} submitLabel="Create Curiosity" submitting={createCuriosity.isPending}>
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="URL" error={errors.url}>
        <input value={url} onChange={e => setUrl(e.target.value)} required type="url" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Type">
        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
          <option value="link">Link</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="article">Article</option>
        </select>
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
      </FormField>
      <FormField label="Category">
        <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
      </FormField>
    </EntityFormShell>
  );
}
