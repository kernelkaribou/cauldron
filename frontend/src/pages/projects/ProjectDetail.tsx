import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjects';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { TechniqueManager } from '@/components/shared/TechniqueManager';
import { MaterialManager } from '@/components/shared/MaterialManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LogFeed } from '@/components/shared/LogFeed';
import { TaskList } from '@/components/shared/TaskList';
import { JournalSection } from '@/components/shared/JournalSection';
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
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{project.title}</h1>
          {project.formula && <Link to={`/formulas/${project.formula.id}`} className="text-sm text-accent-light hover:text-accent">From: {project.formula.title}</Link>}
        </div>
        <div className="flex gap-2">
          <Link to={`/projects/${projectId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">Edit</Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">Delete</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Status</h2>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-lg text-sm ${sc.color} ${sc.bg}`}>{sc.label}</span>
              <div className="flex gap-1">
                {(Object.keys(STATUS_CONFIG) as Project['status'][]).filter(s => s !== project.status).map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)} className={`px-2 py-0.5 rounded text-xs border border-border hover:border-accent transition-colors ${STATUS_CONFIG[s].color}`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {project.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          <TechniqueManager entityType="projects" entityId={projectId} />
          <MaterialManager entityType="projects" entityId={projectId} />
          <PhotoGallery projectId={projectId} />
          <LogFeed projectId={projectId} />
          <JournalSection projectId={projectId} />

          <div className="p-4 bg-card border border-border rounded-xl">
            <p className="text-sm text-text-secondary">Created: {formatDate(project.created_at)}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="projects" entityId={projectId} tags={project.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['projects', projectId] })} />
          </div>
          <TaskList projectId={projectId} />
        </div>
      </div>
    </div>
  );
}
