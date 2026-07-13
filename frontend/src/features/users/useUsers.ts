import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from './usersApi';
import type { CreateUserPayload, UpdateUserPayload, UsersQueryParams } from './types';
import { notify } from '../../utils/notify';
import { getApiErrorMessage } from '../../lib/axios';

const USERS_KEY = 'users';

export function useUsersQuery(params: UsersQueryParams) {
  return useQuery({
    queryKey: [USERS_KEY, params],
    queryFn: () => usersApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: () => {
      notify.success('Utilisateur créé avec succès.');
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
    onError: (error) => notify.error(getApiErrorMessage(error, 'Création impossible')),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      notify.success('Utilisateur modifié avec succès.');
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
    onError: (error) => notify.error(getApiErrorMessage(error, 'Modification impossible')),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      notify.success('Utilisateur supprimé.');
      qc.invalidateQueries({ queryKey: [USERS_KEY] });
    },
    onError: (error) => notify.error(getApiErrorMessage(error, 'Suppression impossible')),
  });
}
