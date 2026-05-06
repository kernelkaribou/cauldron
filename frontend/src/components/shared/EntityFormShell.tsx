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
  maxWidth = 'max-w-2xl',
}: EntityFormShellProps) {
  return (
    <div className={maxWidth}>
      <h1 className="text-2xl font-semibold text-text-primary mb-8">{title}</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        {children}
        {error && <p className="text-sm text-terracotta">{error}</p>}
        {hint && <p className="text-sm text-text-muted italic">{hint}</p>}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || disabled}
            className="px-5 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-dark transition-all disabled:opacity-40 shadow-sm"
          >
            {submitting ? 'Saving...' : submitLabel}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 border border-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-all"
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
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-terracotta mt-1">{error}</p>}
    </div>
  );
}
