import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from '../utils/tokenStorage';
import { store } from '../app/store';
import { clearAuth } from '../features/auth/authSlice';
import { notify } from '../utils/notify';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// --- Requête : ajoute le Bearer token ---
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

// --- Réponse : gestion du refresh token en single-flight ---
type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string> | null = null;

/** Déconnexion propre : purge des tokens, reset du store, redirection login. */
function forceLogout(message?: string): void {
  tokenStorage.clear();
  store.dispatch(clearAuth());
  if (message) {
    notify.error(message);
  }
  if (window.location.pathname !== '/login') {
    window.location.assign('/login');
  }
}

async function requestNewAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    throw new Error('no_refresh_token');
  }
  // Appel « brut » sans intercepteur pour éviter toute boucle.
  const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
  const { accessToken, refreshToken: newRefresh } = response.data;
  tokenStorage.setTokens(accessToken, newRefresh);
  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? '';

    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        refreshPromise = refreshPromise ?? requestNewAccessToken();
        const newToken = await refreshPromise;
        refreshPromise = null;
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      } catch {
        refreshPromise = null;
        forceLogout('Session expirée, veuillez vous reconnecter.');
        return Promise.reject(error);
      }
    }

    // Erreurs API génériques (hors 401 gérés) -> notification.
    if (status && status >= 500) {
      notify.error('Erreur serveur, veuillez réessayer plus tard.');
    }

    return Promise.reject(error);
  },
);

/** Extrait un message d'erreur lisible depuis une erreur Axios. */
export function getApiErrorMessage(error: unknown, fallback = 'Une erreur est survenue'): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  }
  return fallback;
}
