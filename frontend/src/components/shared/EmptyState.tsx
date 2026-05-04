import { Link } from 'react-router-dom';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ title, description, actionLabel, actionTo }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-lg text-text-muted mb-2">{title}</p>
      {description && <p className="text-sm text-text-muted mb-4">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-light transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
