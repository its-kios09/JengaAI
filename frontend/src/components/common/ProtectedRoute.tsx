import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth-store';
import { useSession } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, logout } = useAuthStore();
  const { isLoading, isError } = useSession();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950">
        <Loader2 size={32} className="animate-spin text-primary-500" />
      </div>
    );
  }

  if (isError) {
    logout();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
