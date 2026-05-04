import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCuriosity, useUpdateCuriosity } from '@/hooks/useCuriosities';
import { CraftSelect } from '@/components/shared/CraftSelect';
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
  const [craftId, setCraftId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (curiosity) {
      setTitle(curiosity.title);
      setType(curiosity.type || 'link');
      setDescription(curiosity.description || '');
      setUrl(curiosity.url);
      setCraftId(curiosity.craft_id || null);
    }
  }, [curiosity]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      await updateCuriosity.mutateAsync({
        id: curiosityId,
        data: { title, type, description: description || undefined, url, craft_id: craftId },
      });
      navigate(`/curiosities/${curiosityId}`);
    } catch (err) { if (err instanceof ApiError && err.details) setErrors(err.details); }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Edit Curiosity</h1>
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
        <div className="flex gap-3">
          <button type="submit" disabled={updateCuriosity.isPending} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">Save Changes</button>
          <button type="button" onClick={() => navigate(`/curiosities/${curiosityId}`)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
