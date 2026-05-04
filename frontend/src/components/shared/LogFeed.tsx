import { useState } from 'react';
import { useLogs, useCreateLog, useDeleteLog } from '@/hooks/useSubResources';
import { formatDate } from '@/lib/utils';
import type { Log } from '@/lib/types';

interface LogFeedProps {
  craftId?: number;
  projectId?: number;
}

export function LogFeed({ craftId, projectId }: LogFeedProps) {
  const { data, isLoading } = useLogs({ craft_id: craftId, project_id: projectId });
  const createLog = useCreateLog();
  const deleteLog = useDeleteLog();
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [duration, setDuration] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createLog.mutateAsync({
      content: content || undefined,
      duration_minutes: duration ? parseInt(duration) : 0,
      date,
      craft_id: craftId || null,
      project_id: projectId || null,
    });
    setContent('');
    setDuration('');
    setShowForm(false);
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-text-secondary">Activity Log</h2>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-accent-light hover:text-accent">{showForm ? 'Cancel' : '+ Log'}</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-3 bg-page rounded-lg space-y-2">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="What did you do?" rows={2} className="w-full px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none resize-y" />
          <div className="flex gap-2">
            <input type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="Minutes" min="0" className="w-24 px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-2 py-1.5 bg-card border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
            <button type="submit" disabled={createLog.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">Add</button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && <p className="text-xs text-text-muted">No log entries yet.</p>}
      <div className="space-y-2">
        {data?.items.map((log: Log) => (
          <div key={log.id} className="flex items-start justify-between p-2 bg-page rounded-lg">
            <div className="flex-1 min-w-0">
              {log.content && <p className="text-sm text-text-primary">{log.content}</p>}
              <div className="flex gap-2 text-xs text-text-muted mt-1">
                <span>{formatDate(log.date)}</span>
                {log.duration_minutes > 0 && <span>{log.duration_minutes}m</span>}
              </div>
            </div>
            <button onClick={() => deleteLog.mutate(log.id)} className="text-xs text-text-muted hover:text-error ml-2">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
