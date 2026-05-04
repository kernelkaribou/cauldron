import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { CraftPicker } from '@/components/shared/CraftPicker';
import { ApiError } from '@/lib/api';
import type { Project } from '@/lib/types';

const STATUS_OPTIONS: Array<{ value: Project['status']; label: string }> = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'complete', label: 'Complete' },
  { value: 'paused', label: 'Paused' },
];

export function ProjectEdit() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isLoading } = useProject(projectId);
  const updateProject = useUpdateProject();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Project['status']>('planning');
  const [dueDate, setDueDate] = useState('');
  const [crafts, setCrafts] = useState<Array<{ id: number; title: string; quantity: number }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      setDueDate(project.due_date || '');
      if (project.crafts) {
        setCrafts(project.crafts.map(c => ({ id: c.craft_id, title: c.title || `Craft #${c.craft_id}`, quantity: c.quantity })));
      }
    }
  }, [project]);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    if (crafts.length === 0) {
      setErrors({ crafts: 'At least one craft is required' });
      return;
    }
    try {
      await updateProject.mutateAsync({
        id: projectId,
        data: {
          title,
          description: description || undefined,
          status,
          due_date: dueDate || null,
          crafts: crafts.map(c => ({ id: c.id, quantity: c.quantity })),
        },
      });
      navigate(`/projects/${projectId}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Edit Project</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-sm text-text-secondary mb-1">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
          {errors.title && <p className="text-xs text-error mt-1">{errors.title}</p>}
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as Project['status'])} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-text-secondary mb-1">Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
        </div>
        <CraftPicker selected={crafts} onChange={setCrafts} />
        {errors.crafts && <p className="text-xs text-error">{errors.crafts}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={updateProject.isPending || crafts.length === 0} className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50">Save Changes</button>
          <button type="button" onClick={() => navigate(`/projects/${projectId}`)} className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors">Cancel</button>
        </div>
      </form>
    </div>
  );
}
