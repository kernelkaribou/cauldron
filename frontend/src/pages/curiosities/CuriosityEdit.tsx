import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCuriosity, useUpdateCuriosity } from '@/hooks/useCuriosities';
import { CategorySelect } from '@/components/shared/CategorySelect';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
import { ApiError } from '@/lib/api';

export function CuriosityEdit() {
  const { id } = useParams();
  const curiosityId = Number(id);
  const { data: curiosity, isLoading } = useCuriosity(curiosityId);
  const updateCuriosity = useUpdateCuriosity();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('link');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (curiosity) {
      setTitle(curiosity.title);
      setType(curiosity.type || 'link');
      setDescription(curiosity.description || '');
      setUrl(curiosity.url);
      setCategoryId(curiosity.category_id || null);
    }
  }, [curiosity]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updateCuriosity.mutateAsync({
        id: curiosityId,
        data: { title, type, description: description || undefined, url, category_id: categoryId },
      });
      navigate(`/curiosities/${curiosityId}`);
    } catch (err) { if (err instanceof ApiError && err.details) setErrors(err.details); }
  }

  return (
    <EntityFormShell title="Edit Curiosity" onSubmit={handleSubmit} submitLabel="Save Changes" submitting={updateCuriosity.isPending} onCancel={() => navigate(`/curiosities/${curiosityId}`)}>
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="URL" error={errors.url}>
        <input value={url} onChange={e => setUrl(e.target.value)} required type="url" className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Type">
        <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none">
          <option value="link">Link</option>
          <option value="video">Video</option>
          <option value="image">Image</option>
          <option value="article">Article</option>
        </select>
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-4 py-2.5 bg-page border border-border rounded-xl text-text-primary focus:border-accent focus:outline-none resize-y" />
      </FormField>
      <FormField label="Category">
        <CategorySelect categoryId={categoryId} onCategoryChange={setCategoryId} />
      </FormField>
    </EntityFormShell>
  );
}
