import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import type { CreateUserPayload, User, UserStatut } from '../../features/users/types';
import { useRoleOptions } from '../../features/roles/useRoles';

const STATUTS: UserStatut[] = ['ACTIF', 'INACTIF', 'SUSPENDU'];

interface UserFormDialogProps {
  open: boolean;
  user?: User | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateUserPayload) => void;
}

export function UserFormDialog({ open, user, loading, onClose, onSubmit }: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const { data: roles = [] } = useRoleOptions();

  // Le mot de passe est requis en création, optionnel en modification.
  const schema = useMemo(
    () =>
      z.object({
        nom: z.string().min(1, 'Le nom est requis').max(120),
        email: z.string().min(1, 'E-mail requis').email('E-mail invalide'),
        telephone: z.string().max(30).optional().or(z.literal('')),
        motDePasse: isEdit
          ? z.string().max(72).optional().or(z.literal(''))
          : z.string().min(6, 'Au moins 6 caractères').max(72),
        idRole: z.coerce.number().int().min(1, 'Le rôle est requis'),
        statut: z.enum(['ACTIF', 'INACTIF', 'SUSPENDU']),
      }),
    [isEdit],
  );

  type UserForm = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<UserForm>({
    resolver: zodResolver(schema),
    defaultValues: { nom: '', email: '', telephone: '', motDePasse: '', idRole: 0, statut: 'ACTIF' },
  });

  useEffect(() => {
    if (open) {
      reset({
        nom: user?.nom ?? '',
        email: user?.email ?? '',
        telephone: user?.telephone ?? '',
        motDePasse: '',
        idRole: user?.idRole ?? 0,
        statut: user?.statut ?? 'ACTIF',
      });
    }
  }, [open, user, reset]);

  const submit = (values: UserForm) => {
    const payload: CreateUserPayload = {
      nom: values.nom.trim(),
      email: values.email.trim(),
      telephone: values.telephone?.trim() ? values.telephone.trim() : undefined,
      idRole: values.idRole,
      statut: values.statut,
      // Mot de passe : envoyé seulement s'il est renseigné.
      motDePasse: values.motDePasse ?? '',
    };
    if (isEdit && !values.motDePasse) {
      delete (payload as Partial<CreateUserPayload>).motDePasse;
    }
    onSubmit(payload);
  };

  const { ref: nomRef, ...nomField } = register('nom');
  const { ref: emailRef, ...emailField } = register('email');
  const { ref: telRef, ...telField } = register('telephone');
  const { ref: pwdRef, ...pwdField } = register('motDePasse');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}</DialogTitle>
      <form onSubmit={handleSubmit(submit)} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nom"
              fullWidth
              autoFocus
              error={Boolean(errors.nom)}
              helperText={errors.nom?.message}
              inputRef={nomRef}
              {...nomField}
            />
            <TextField
              label="E-mail"
              type="email"
              fullWidth
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
              inputRef={emailRef}
              {...emailField}
            />
            <TextField
              label="Téléphone"
              fullWidth
              error={Boolean(errors.telephone)}
              helperText={errors.telephone?.message}
              inputRef={telRef}
              {...telField}
            />
            <TextField
              label={isEdit ? 'Mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe'}
              type="password"
              fullWidth
              autoComplete="new-password"
              error={Boolean(errors.motDePasse)}
              helperText={errors.motDePasse?.message}
              inputRef={pwdRef}
              {...pwdField}
            />
            <Controller
              name="idRole"
              control={control}
              render={({ field }) => (
                <TextField
                  select
                  label="Rôle"
                  fullWidth
                  error={Boolean(errors.idRole)}
                  helperText={errors.idRole?.message}
                  {...field}
                  value={field.value || ''}
                >
                  <MenuItem value="" disabled>
                    — Sélectionner —
                  </MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.nom}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <Controller
              name="statut"
              control={control}
              render={({ field }) => (
                <TextField select label="Statut" fullWidth {...field}>
                  {STATUTS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {isEdit ? 'Enregistrer' : 'Créer'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
