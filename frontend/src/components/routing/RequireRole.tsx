import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

/**
 * Contrôle d'accès par rôle/profil (RBAC côté frontend).
 * L'Administrateur Général est toujours autorisé.
 * Sinon le profil de l'utilisateur doit figurer dans la liste autorisée.
 */
export function RequireRole({ roles }: { roles: string[] }) {
  const { user, isAdminGeneral } = useAuth();

  const allowed = !!user && (isAdminGeneral || roles.includes(user.role));
  if (!allowed) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
