-- Ajout de la colonne de permissions granulaires par utilisateur (matrice module -> actions).
-- NULL = permissions dérivées du profil (rôle) ; objet JSON = permissions personnalisées.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "permissions" JSONB;
