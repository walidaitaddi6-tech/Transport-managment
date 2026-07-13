/**
 * Stockage des tokens JWT.
 * Source de vérité unique pour les tokens (lue par l'intercepteur Axios).
 */
const ACCESS_KEY = 'tm_access_token';
const REFRESH_KEY = 'tm_refresh_token';

export const tokenStorage = {
  getAccess(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
  hasSession(): boolean {
    return Boolean(localStorage.getItem(ACCESS_KEY));
  },
};
