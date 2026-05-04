import { useState } from 'react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useSubResources';
import type { Task } from '@/lib/types';

interface TaskListProps {
  recipeId?: number;
  brewId?: number;
}

export function TaskList({ recipeId, brewId }: TaskListProps) {
  const { data, isLoading } = useTasks({ recipe_id: recipeId, brew_id: brewId });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [newTitle, setNewTitle] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await createTask.mutateAsync({
      title: newTitle,
      recipe_id: recipeId || null,
      brew_id: brewId || null,
    });
    setNewTitle('');
  }

  function toggleDone(task: Task) {
    updateTask.mutate({ id: task.id, data: { done: task.done ? 0 : 1 } });
  }

  return (
    <div className="p-4 bg-card border border-border rounded-xl">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Tasks</h2>

      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Add a task..." className="flex-1 px-2 py-1.5 bg-page border border-border rounded text-sm text-text-primary focus:border-accent focus:outline-none" />
        <button type="submit" disabled={createTask.isPending} className="px-3 py-1.5 bg-accent text-white rounded text-xs hover:bg-accent-light disabled:opacity-50">Add</button>
      </form>

      {isLoading && <p className="text-xs text-text-muted">Loading...</p>}
      {data?.items.length === 0 && !isLoading && <p className="text-xs text-text-muted">No tasks yet.</p>}
      <div className="space-y-1">
        {data?.items.map((task: Task) => (
          <div key={task.id} className="flex items-center gap-2 p-2 bg-page rounded-lg group">
            <button onClick={() => toggleDone(task)} className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-xs ${task.done ? 'bg-accent border-accent text-white' : 'border-border hover:border-accent'}`}>
              {task.done ? '✓' : ''}
            </button>
            <span className={`flex-1 text-sm ${task.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>{task.title}</span>
            {task.due_date && <span className="text-xs text-text-muted">{task.due_date}</span>}
            <button onClick={() => deleteTask.mutate(task.id)} className="text-xs text-text-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
