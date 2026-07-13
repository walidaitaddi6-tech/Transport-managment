import { SetMetadata } from '@nestjs/common';

/** Clé de métadonnée marquant une route comme publique (sans JWT). */
export const IS_PUBLIC_KEY = 'isPublic';

/** Décorateur @Public() — exclut une route de la protection JWT. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
