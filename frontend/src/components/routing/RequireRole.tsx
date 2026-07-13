import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

/**
 * Contrôle d'accès par rôle (RBAC côté frontend).
 * Si le rôle de l'utilisateur n'est pas autorisé -> page 403.
 * ADMIN est toujours autorisé.
 */
export function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth();

  const allowed = !!user && (user.role === 'ADMIN' || roles.includes(user.role));
  if (!allowed) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
