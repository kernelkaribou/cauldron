import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCuriosity } from '@/hooks/useCuriosities';
import { CraftSelect } from '@/components/shared/CraftSelect';
import { ApiError } from '@/lib/api';

export function CuriosityNew() {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('link');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [craftId, setCraftId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createCuriosity = useCreateCuriosity();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const cur = await createCuriosity.mutateAsync({
        title,
        type,
        description: description || undefined,
        url,
        craft_id: craftId,
      });
      navigate(`/curiosities/${cur.id}`);
    } catch (err) { if (err instanceof ApiError && err.details) setErrors(err.details); }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">New Curiosity</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} required type="url" className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.url && <p className="text-xs text-error mt-1">{errors.url}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
            <option value="link">Link</option>
            <option value="video">Video</option>
            <option value="image">Image</option>
            <option value="article">Article</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Craft</label>
          <CraftSelect value={craftId} onChange={setCraftId} />
        </div>
        <button type="submit" disabled={createCuriosity.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">
          {createCuriosity.isPending ? 'Creating...' : 'Create Curiosity'}
        </button>
      </form>
    </div>
  );
}
