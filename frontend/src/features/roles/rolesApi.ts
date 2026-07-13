import { api } from '../../lib/axios';
import type { PaginatedRoles, Role, RolePayload, RolesQueryParams } from './types';

export const rolesApi = {
  async list(params: RolesQueryParams): Promise<PaginatedRoles> {
    const { data } = await api.get<PaginatedRoles>('/roles', { params });
    return data;
  },

  async create(payload: RolePayload): Promise<Role> {
    const { data } = await api.post<Role>('/roles', payload);
    return data;
  },

  async update(id: number, payload: RolePayload): Promise<Role> {
    const { data } = await api.patch<Role>(`/roles/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },
};
