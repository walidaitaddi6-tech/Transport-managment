import { SetMetadata } from '@nestjs/common';

/** Clé de métadonnée listant les rôles autorisés sur une route. */
export const ROLES_KEY = 'roles';

/** Décorateur @Roles('ADMIN', 'COMPTABLE') — restreint l'accès par rôle. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
