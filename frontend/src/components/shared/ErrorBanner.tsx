interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="p-4 rounded-xl bg-terracotta-bg text-terracotta flex items-center justify-between mb-4">
      <span className="text-sm">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-sm underline hover:no-underline ml-4">
          Retry
        </button>
      )}
    </div>
  );
}
