import { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';

export function AuthGuard() {
  const { user, isLoading, refresh } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-text-muted">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
