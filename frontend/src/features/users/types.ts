export type UserStatut = 'ACTIF' | 'INACTIF' | 'SUSPENDU';

export interface UserRoleRef {
  id: number;
  nom: string;
}

export interface User {
  id: number;
  nom: string;
  email: string;
  telephone: string | null;
  statut: UserStatut;
  derniereConnexion: string | null;
  creeLe: string;
  idRole: number;
  role: UserRoleRef;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedUsers {
  data: User[];
  meta: PaginationMeta;
}

export interface UsersQueryParams {
  page: number;
  limit: number;
  search?: string;
  statut?: UserStatut;
  sortBy?: 'id' | 'nom' | 'email';
  sortOrder?: 'asc' | 'desc';
}

export interface CreateUserPayload {
  nom: string;
  email: string;
  telephone?: string;
  motDePasse: string;
  idRole: number;
  statut?: UserStatut;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;
