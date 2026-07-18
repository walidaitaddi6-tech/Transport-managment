import { useMutation } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { tokenStorage } from '../../utils/tokenStorage';
import { notify } from '../../utils/notify';
import { emptyMatrix, type PermissionAction } from '../../constants/permissions';
import { authApi } from './authApi';
import { clearAuth, setUser } from './authSlice';
import type { AuthTokens, LoginPayload, RegisterPayload } from './types';

/** État d'authentification + actions (login/logout/permissions). */
export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const status = useAppSelector((s) => s.auth.status);

  const logout = () => {
    tokenStorage.clear();
    dispatch(clearAuth());
    notify.info('Vous êtes déconnecté.');
  };

  /** L'utilisateur connecté a-t-il l'autorisation module × action ? */
  const can = (moduleKey: string, action: PermissionAction = 'voir'): boolean => {
    if (!user) return false;
    if (user.isAdminGeneral) return true;
    return Boolean(user.permissions?.[moduleKey]?.[action]);
  };

  return {
    user,
    status,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'idle' || status === 'loading',
    isAdminGeneral: Boolean(user?.isAdminGeneral),
    can,
    logout,
  };
}

/** Mutation React Query pour la connexion. */
export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation<AuthTokens, unknown, LoginPayload>({
    mutationFn: (payload) => authApi.login(payload),
    onSuccess: async (data) => {
      tokenStorage.setTokens(data.accessToken, data.refreshToken);
      // Authentifie immédiatement (évite un rebond de route)…
      dispatch(
        setUser({
          ...data.user,
          isAdminGeneral: data.user.role === 'ADMIN_GENERAL' || data.user.role === 'ADMIN',
          permissions: emptyMatrix(),
        }),
      );
      // …puis enrichit avec les permissions effectives.
      try {
        const full = await authApi.me();
        dispatch(setUser(full));
      } catch {
        /* le profil minimal reste actif */
      }
    },
  });
}

/** Mutation React Query pour l'inscription. */
export function useRegister() {
  return useMutation<void, unknown, RegisterPayload>({
    mutationFn: (payload) => authApi.register(payload),
  });
}
