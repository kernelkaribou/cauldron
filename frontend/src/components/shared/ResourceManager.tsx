import { useState } from 'react';
import { useTechniqueResources, useAddTechniqueResource, useDeleteTechniqueResource } from '@/hooks/useSubResources';
import type { TechniqueResource } from '@/lib/types';

interface ResourceManagerProps {
  techniqueId: number;
}

export function ResourceManager({ techniqueId }: ResourceManagerProps) {
  const { data, isLoading } = useTechniqueResources(techniqueId);
  const addResource = useAddTechniqueResource();
  const deleteResource = useDeleteTechniqueResource();
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('article');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addResource.mutateAsync({ techniqueId, data: { url, title, type } });
    setUrl('');
    setTitle('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Resources</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Add'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-3 p-3 bg-page rounded-xl space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="URL" required type="url" className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <select value={type} onChange={e => setType(e.target.value)} className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none">
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="other">Other</option>
          </select>
          <button type="submit" disabled={addResource.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-dark disabled:opacity-50">Add Resource</button>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No resources yet.</p>}
      <div className="space-y-1">
        {data?.items.map((res: TechniqueResource) => (
          <div key={res.id} className="flex items-center justify-between p-2 bg-page rounded-xl group">
            <div className="min-w-0 flex-1">
              <a href={res.url} target="_blank" rel="noopener noreferrer" className="text-sm text-accent-light hover:text-accent truncate block">{res.title}</a>
              {res.type && <span className="text-xs text-text-muted">{res.type}</span>}
            </div>
            <button onClick={() => { if (confirm('Remove this resource?')) deleteResource.mutate({ techniqueId, resourceId: res.id }); }} className="text-xs text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity ml-2">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
