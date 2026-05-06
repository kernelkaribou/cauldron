import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface DetailPageShellProps {
  title: string;
  subtitle?: ReactNode;
  editPath: string;
  onDelete: () => void;
  headerActions?: ReactNode;
  left: ReactNode;
  sidebar: ReactNode;
}

export function DetailPageShell({ title, subtitle, editPath, onDelete, headerActions, left, sidebar }: DetailPageShellProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">{title}</h1>
          {subtitle && <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">{subtitle}</div>}
        </div>
        <div className="flex gap-2">
          {headerActions}
          <Link to={editPath} className="px-4 py-2 border border-border rounded-xl text-sm text-text-secondary hover:border-accent hover:text-accent transition-all">Edit</Link>
          <button onClick={onDelete} className="px-4 py-2 border border-border rounded-xl text-sm text-text-muted hover:border-terracotta hover:text-terracotta transition-all">Delete</button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-6">{left}</div>
        <div className="space-y-5">{sidebar}</div>
      </div>
    </div>
  );
}

interface MetadataCardProps {
  items: Array<{ label: string; value: ReactNode }>;
}

export function MetadataCard({ items }: MetadataCardProps) {
  const filtered = items.filter(item => item.value !== null && item.value !== undefined && item.value !== '');
  if (filtered.length === 0) return null;

  return (
    <div className="p-5 bg-card border border-border rounded-2xl shadow-sm">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Details</h2>
      <dl className="space-y-3 text-sm">
        {filtered.map(item => (
          <div key={item.label}>
            <dt className="text-text-muted text-xs uppercase tracking-wider">{item.label}</dt>
            <dd className="text-text-primary mt-0.5">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

interface TagsCardProps {
  children: ReactNode;
}

export function TagsCard({ children }: TagsCardProps) {
  return (
    <div className="p-5 bg-card border border-border rounded-2xl shadow-sm">
      <h2 className="text-sm font-medium text-text-secondary mb-3">Tags</h2>
      {children}
    </div>
  );
}
