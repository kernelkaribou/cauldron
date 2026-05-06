import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-text-muted mb-4">404</h1>
      <p className="text-text-secondary mb-6">Page not found</p>
      <Link to="/" className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-dark transition-all">
        Back to Home
      </Link>
    </div>
  );
}
