import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject } from '@/hooks/useProjects';
import { CraftPicker } from '@/components/shared/CraftPicker';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
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
    <EntityFormShell title="Edit Project" onSubmit={handleSubmit} submitLabel="Save Changes" submitting={updateProject.isPending} onCancel={() => navigate(`/projects/${projectId}`)}>
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
      </FormField>
      <FormField label="Status">
        <select value={status} onChange={e => setStatus(e.target.value as Project['status'])} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none">
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormField>
      <FormField label="Due Date">
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <CraftPicker selected={crafts} onChange={setCrafts} />
    </EntityFormShell>
  );
}
