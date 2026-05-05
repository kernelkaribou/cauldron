import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateProject } from '@/hooks/useProjects';
import { CraftPicker } from '@/components/shared/CraftPicker';
import { EntityFormShell, FormField } from '@/components/shared/EntityFormShell';
import { ApiError } from '@/lib/api';

export function ProjectNew() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [crafts, setCrafts] = useState<Array<{ id: number; title: string; quantity: number }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createProject = useCreateProject();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    try {
      const project = await createProject.mutateAsync({
        title,
        description: description || undefined,
        due_date: dueDate || undefined,
        crafts: crafts.length > 0 ? crafts.map(c => ({ id: c.id, quantity: c.quantity })) : undefined,
      });
      navigate(`/projects/${project.id}`);
    } catch (err) {
      if (err instanceof ApiError && err.details) setErrors(err.details);
    }
  }

  return (
    <EntityFormShell
      title="New Project"
      onSubmit={handleSubmit}
      submitLabel="Create Project"
      submitting={createProject.isPending || !title.trim()}
      hint="You can add techniques, supplies, and more after creating the project."
      error={errors._}
    >
      <FormField label="Title" error={errors.title}>
        <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <FormField label="Description">
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none resize-y" />
      </FormField>
      <FormField label="Due Date">
        <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="px-3 py-2 bg-page border border-border rounded-lg text-text-primary focus:border-accent focus:outline-none" />
      </FormField>
      <CraftPicker selected={crafts} onChange={setCrafts} />
    </EntityFormShell>
  );
}
