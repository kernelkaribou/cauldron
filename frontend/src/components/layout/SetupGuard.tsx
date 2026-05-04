import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { apiFetch } from '@/lib/api';

export function SetupGuard() {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    apiFetch<{ needsSetup: boolean }>('/auth/setup-status')
      .then(data => setNeedsSetup(data.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  if (needsSetup === null) {
    return <div className="flex items-center justify-center min-h-screen text-text-muted">Loading...</div>;
  }

  if (needsSetup) {
    return <Navigate to="/setup" replace />;
  }

  return <Outlet />;
}
