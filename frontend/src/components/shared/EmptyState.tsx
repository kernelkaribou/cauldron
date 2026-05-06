import { Link } from 'react-router-dom';

interface Props {
  title: string;
  description?: string;
  actionLabel?: string;
  actionTo?: string;
}

export function EmptyState({ title, description, actionLabel, actionTo }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg text-text-muted mb-2">{title}</p>
      {description && <p className="text-sm text-text-muted mb-6">{description}</p>}
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all font-medium shadow-sm"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
