interface CoverThumbProps {
  photoId: number | null | undefined;
  alt?: string;
  className?: string;
}

export function CoverThumb({ photoId, alt = '', className = '' }: CoverThumbProps) {
  if (!photoId) {
    return (
      <div className={`bg-card-elevated border border-border-subtle flex items-center justify-center text-text-muted ${className}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={`/api/photos/file/${photoId}/thumb_200.webp`}
      alt={alt}
      className={`object-cover ${className}`}
    />
  );
}
