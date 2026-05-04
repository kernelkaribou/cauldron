import { useParams, Link, useNavigate } from 'react-router-dom';
import { useFormula, useDeleteFormula } from '@/hooks/useFormulas';
import { useCreateProjectFromFormula } from '@/hooks/useProjects';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { TagSelect } from '@/components/shared/TagSelect';
import { TechniqueManager } from '@/components/shared/TechniqueManager';
import { MaterialManager } from '@/components/shared/MaterialManager';
import { PhotoGallery } from '@/components/shared/PhotoGallery';
import { LogFeed } from '@/components/shared/LogFeed';
import { TaskList } from '@/components/shared/TaskList';
import { JournalSection } from '@/components/shared/JournalSection';
import { formatDate, formatDuration } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';

export function FormulaDetail() {
  const { id } = useParams();
  const formulaId = Number(id);
  const { data: formula, isLoading, error, refetch } = useFormula(formulaId);
  const deleteFormula = useDeleteFormula();
  const createProject = useCreateProjectFromFormula();
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (isLoading) return <p className="text-text-muted">Loading...</p>;
  if (error) return <ErrorBanner message={(error as Error).message} onRetry={() => refetch()} />;
  if (!formula) return <p className="text-text-muted">Formula not found</p>;

  async function handleDelete() {
    if (!confirm('Delete this formula?')) return;
    await deleteFormula.mutateAsync(formulaId);
    navigate('/formulas');
  }

  async function handleStartProject() {
    const project = await createProject.mutateAsync({
      formula_id: formulaId,
      title: `${formula!.title} - Project`,
    });
    navigate(`/projects/${project.id}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{formula.title}</h1>
          {formula.craft && <p className="text-sm text-accent-light">{formula.craft.name}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={handleStartProject} className="px-3 py-1.5 bg-accent text-white rounded-lg text-sm hover:bg-accent-light transition-colors">
            Start a Project
          </button>
          <Link to={`/formulas/${formulaId}/edit`} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-secondary hover:border-accent hover:text-accent transition-colors">
            Edit
          </Link>
          <button onClick={handleDelete} className="px-3 py-1.5 border border-border rounded-lg text-sm text-text-muted hover:border-error hover:text-error transition-colors">
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {formula.description && (
            <div className="p-4 bg-card border border-border rounded-xl">
              <h2 className="text-sm font-medium text-text-secondary mb-2">Description</h2>
              <p className="text-text-primary whitespace-pre-wrap">{formula.description}</p>
            </div>
          )}

          <TechniqueManager entityType="formulas" entityId={formulaId} />
          <MaterialManager entityType="formulas" entityId={formulaId} />
          <PhotoGallery formulaId={formulaId} />
          <LogFeed formulaId={formulaId} />
          <JournalSection formulaId={formulaId} />

          <div className="p-4 bg-card border border-border rounded-xl">
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              {formula.duration_minutes > 0 && <span>Duration: {formatDuration(formula.duration_minutes)}</span>}
              <span>Created: {formatDate(formula.created_at)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-card border border-border rounded-xl">
            <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
            <TagSelect entityType="formulas" entityId={formulaId} tags={formula.tags || []} onUpdate={() => qc.invalidateQueries({ queryKey: ['formulas', formulaId] })} />
          </div>
          <TaskList formulaId={formulaId} />
        </div>
      </div>
    </div>
  );
}
