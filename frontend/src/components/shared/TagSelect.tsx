import { useState } from 'react';
import { useTags, useCreateTag } from '@/hooks/useTags';
import { apiFetch } from '@/lib/api';
import type { Tag } from '@/lib/types';

interface Props {
  entityType: 'crafts' | 'techniques' | 'projects' | 'supplies' | 'curiosities';
  entityId: number;
  tags: Tag[];
  onUpdate: () => void;
}

export function TagSelect({ entityType, entityId, tags, onUpdate }: Props) {
  const { data } = useTags();
  const createTag = useCreateTag();
  const [newName, setNewName] = useState('');

  const available = data?.items.filter(t => !tags.find(et => et.id === t.id)) || [];

  async function addTag(tagId: number) {
    await apiFetch(`/${entityType}/${entityId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tag_id: tagId }),
    });
    onUpdate();
  }

  async function removeTag(tagId: number) {
    await apiFetch(`/${entityType}/${entityId}/tags/${tagId}`, { method: 'DELETE' });
    onUpdate();
  }

  async function createAndAdd() {
    if (!newName.trim()) return;
    const tag = await createTag.mutateAsync(newName.trim());
    await addTag(tag.id);
    setNewName('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {tags.map(tag => (
          <span key={tag.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-bg text-accent-light text-xs rounded-full">
            {tag.name}
            <button onClick={() => removeTag(tag.id)} className="text-text-muted hover:text-error">&times;</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <select
          onChange={e => { if (e.target.value) addTag(Number(e.target.value)); e.target.value = ''; }}
          className="flex-1 px-2 py-1.5 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none"
        >
          <option value="">Add tag...</option>
          {available.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New tag"
          className="w-24 px-2 py-1.5 bg-page border border-border rounded-lg text-text-primary text-sm focus:border-accent focus:outline-none"
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), createAndAdd())}
        />
      </div>
    </div>
  );
}
