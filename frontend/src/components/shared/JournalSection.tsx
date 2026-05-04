import { useState } from 'react';
import { useJournalEntries, useCreateJournalEntry, useDeleteJournalEntry } from '@/hooks/useSubResources';
import { formatDate } from '@/lib/utils';
import type { JournalEntry } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface JournalSectionProps {
  formulaId?: number;
  projectId?: number;
}

export function JournalSection({ formulaId, projectId }: JournalSectionProps) {
  const { data, isLoading } = useJournalEntries({ formula_id: formulaId, project_id: projectId });
  const createEntry = useCreateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createEntry.mutateAsync({
      title,
      content: content || undefined,
      formula_id: formulaId || null,
      project_id: projectId || null,
    });
    setTitle('');
    setContent('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Journal</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Entry'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-page rounded-lg space-y-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" required className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your thoughts (Markdown supported)..." rows={4} className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none resize-y font-mono" />
          <button type="submit" disabled={createEntry.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">Save Entry</button>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No journal entries yet.</p>}
      <div className="space-y-2">
        {data?.items.map((entry: JournalEntry) => (
          <div key={entry.id} className="p-2 bg-page rounded-lg">
            <div className="flex items-center justify-between">
              <button onClick={() => setExpanded(expanded === entry.id ? null : entry.id)} className="text-sm font-medium text-text-primary hover:text-accent text-left flex-1">{entry.title}</button>
              <div className="flex items-center gap-2 ml-2">
                <span className="text-xs text-text-muted">{formatDate(entry.created_at)}</span>
                <button onClick={() => deleteEntry.mutate(entry.id)} className="text-xs text-text-muted hover:text-error">×</button>
              </div>
            </div>
            {expanded === entry.id && entry.content && (
              <div className="mt-2 text-sm text-text-secondary prose prose-invert prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{entry.content}</ReactMarkdown>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
