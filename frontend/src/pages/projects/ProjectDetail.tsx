import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjects';
import { useCreateCraftFromProject } from '@/hooks/useCrafts';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { DetailPageShell, TagsCard } from '@/components/shared/DetailPageShell';
import { TagSelect } from '@/components/shared/TagSelect';
import { TechniqueManager } from '@/components/shared/TechniqueManager';
import { SupplyManager } from '@/components/shared/SupplyManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LogFeed } from '@/components/shared/LogFeed';
import { TaskList } from '@/components/shared/TaskList';
import { NotesSection } from '@/components/shared/NotesSection';
import { STATUS_CONFIG } from '@/lib/theme';
import { formatDate } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { Project } from '@/lib/types';

export function ProjectDetail() {
  const { id } = useParams();
  const projectId = Number(id);
  const { data: project, isLoading, error, refetch } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();
  const createCraft = useCreateCraftFromProject();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [savingCraft, setSavingCraft] = useState(false);

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!project) return <p className="text-text-muted">Project not found</p>;

  const sc = STATUS_CONFIG[project.status];

  async function handleDelete() {
    if (!confirm('Delete this project?')) return;
    await deleteProject.mutateAsync(projectId);
    navigate('/projects');
  }

  async function handleStatusChange(status: Project['status']) {
    await updateProject.mutateAsync({ id: projectId, data: { status } });
  }

  async function handleSaveAsCraft() {
    if (!project) return;
    setSavingCraft(true);
    try {
      const craft = await createCraft.mutateAsync({
        project_id: projectId,
        title: `${project.title} (Template)`,
        description: project.description || undefined,
      });
      navigate(`/crafts/${craft.id}`);
    } catch {
      setSavingCraft(false);
    }
  }

  return (
    <DetailPageShell
      title={project.title}
      editPath={`/projects/${projectId}/edit`}
      onDelete={handleDelete}
      left={<>
        {project.description && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
            <p className="text-text-primary whitespace-pre-wrap">{project.description}</p>
          </div>
        )}
        <TechniqueManager entityType="projects" entityId={projectId} />
        <SupplyManager entityType="projects" entityId={projectId} />
        {project.status === 'complete' && (
          <div className="p-4 bg-card border border-border rounded-xl">
            <button
              onClick={handleSaveAsCraft}
              disabled={savingCraft}
              className="w-full px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark disabled:opacity-50 font-medium"
            >
              {savingCraft ? 'Creating...' : 'Save as Craft Template'}
            </button>
            <p className="text-xs text-text-muted mt-2">Create a reusable craft blueprint from this project's techniques and supplies</p>
          </div>
        )}
        <PhotoGallery entityType="project" entityId={projectId} />
        <LogFeed projectId={projectId} />
        <NotesSection entityType="project" entityId={projectId} />
      </>}
      sidebar={<>
        <div className="p-4 bg-card border border-border rounded-xl">
          <h2 className="text-sm font-medium text-text-secondary mb-3">Details</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-text-muted text-xs">Status</dt>
              <dd className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded text-xs ${sc.color} ${sc.bg}`}>{sc.label}</span>
                <div className="flex gap-1">
                  {(Object.keys(STATUS_CONFIG) as Project['status'][]).filter(s => s !== project.status).map(s => (
                    <button key={s} onClick={() => handleStatusChange(s)} className={`px-1.5 py-0.5 rounded text-[10px] border border-border hover:border-accent transition-all ${STATUS_CONFIG[s].color}`}>
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </dd>
            </div>
            {project.due_date && (
              <div><dt className="text-text-muted text-xs">Due Date</dt><dd className="text-text-primary">{formatDate(project.due_date)}</dd></div>
            )}
            {project.crafts && project.crafts.length > 0 && (
              <div>
                <dt className="text-text-muted text-xs">Crafts</dt>
                <dd className="mt-1 space-y-1">
                  {project.crafts.map(c => (
                    <Link key={c.craft_id} to={`/crafts/${c.craft_id}`} className="block text-sm text-accent-light hover:text-accent">
                      {c.title || `Craft #${c.craft_id}`}{c.quantity > 1 ? ` ×${c.quantity}` : ''}
                    </Link>
                  ))}
                </dd>
              </div>
            )}
            <div><dt className="text-text-muted text-xs">Created</dt><dd className="text-text-primary">{formatDate(project.created_at)}</dd></div>
            <div><dt className="text-text-muted text-xs">Updated</dt><dd className="text-text-primary">{formatDate(project.updated_at)}</dd></div>
          </dl>
        </div>
        <TagsCard>
          <TagSelect entityType="projects" entityId={projectId} tags={project.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['projects', projectId] })} />
        </TagsCard>
        <TaskList projectId={projectId} />
      </>}
    />
  );
}
