import { api } from '../../lib/axios';
import type {
  CreateUserPayload,
  PaginatedUsers,
  UpdateUserPayload,
  User,
  UsersQueryParams,
  UsersStats,
} from './types';

export const usersApi = {
  async list(params: UsersQueryParams): Promise<PaginatedUsers> {
    const { data } = await api.get<PaginatedUsers>('/users', { params });
    return data;
  },

  async stats(): Promise<UsersStats> {
    const { data } = await api.get<UsersStats>('/users/stats');
    return data;
  },

  async create(payload: CreateUserPayload): Promise<User> {
    const { data } = await api.post<User>('/users', payload);
    return data;
  },

  async update(id: number, payload: UpdateUserPayload): Promise<User> {
    const { data } = await api.patch<User>(`/users/${id}`, payload);
    return data;
  },

  async remove(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },
};
