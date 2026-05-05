import type { ReactNode } from 'react';

interface EntityFormShellProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  submitLabel: string;
  submitting?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  error?: string;
  hint?: string;
  children: ReactNode;
  maxWidth?: string;
}

export function EntityFormShell({
  title,
  onSubmit,
  submitLabel,
  submitting,
  disabled,
  onCancel,
  error,
  hint,
  children,
  maxWidth = 'max-w-xl',
}: EntityFormShellProps) {
  return (
    <div className={maxWidth}>
      <h1 className="text-xl font-semibold text-text-primary mb-6">{title}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {children}
        {error && <p className="text-sm text-error">{error}</p>}
        {hint && <p className="text-xs text-text-muted">{hint}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting || disabled}
            className="px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-border rounded-lg text-text-secondary hover:border-accent transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm text-text-secondary mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
