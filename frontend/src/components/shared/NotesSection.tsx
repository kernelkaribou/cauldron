import { useState } from 'react';
import { useNotes, useCreateNote, useDeleteNote } from '@/hooks/useSubResources';
import { formatDate } from '@/lib/utils';
import type { Note } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface NotesSectionProps {
  entityType: 'project' | 'craft' | 'technique' | 'supply' | 'curiosity';
  entityId: number;
}

export function NotesSection({ entityType, entityId }: NotesSectionProps) {
  const { data, isLoading } = useNotes({ entity_type: entityType, entity_id: entityId });
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createNote.mutateAsync({
      entity_type: entityType,
      entity_id: entityId,
      title,
      content: content || undefined,
    });
    setTitle('');
    setContent('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Notes</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Note'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-page rounded-xl space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts (Markdown supported)..." rows={4} className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none resize-y font-mono" />
          <button type="submit" disabled={createNote.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-dark disabled:opacity-50">Save Note</button>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No notes yet.</p>}
      <div className="space-y-2">
        {data?.items.map((note: Note) => (
          <div key={note.id} className="p-2 bg-page rounded-xl">
            <div className="flex items-center justify-between">
              <button onClick={() => setExpanded(expanded === note.id ? null : note.id)} className="text-sm font-medium text-text-primary hover:text-accent text-left flex-1">{note.title}</button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-text-muted">{formatDate(note.created_at)}</span>
                <button onClick={() => { if (confirm('Delete this note?')) deleteNote.mutate(note.id); }} className="text-xs text-text-muted hover:text-error">×</button>
              </div>
            </div>
            {expanded === note.id && note.content && (
              <div className="mt-2 text-sm text-text-secondary prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
