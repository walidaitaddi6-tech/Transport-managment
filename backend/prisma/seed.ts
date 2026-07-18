/**
 * Seed Prisma — insère les rôles applicatifs par défaut et l'administrateur par défaut.
 * Idempotent : peut être rejoué sans créer de doublons.
 *
 * Exécution : npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Profils applicatifs (rôles). ADMIN_GENERAL = super-administrateur (gère les utilisateurs).
const ROLES: { nom: string; description: string }[] = [
  { nom: 'ADMIN_GENERAL', description: 'Administrateur Général — accès total, gère les utilisateurs et leurs permissions' },
  { nom: 'ADMINISTRATEUR', description: 'Administrateur — accès étendu (hors gestion des utilisateurs)' },
  { nom: 'EXPLOITANT', description: 'Exploitation : voyages, véhicules, conducteurs, clients, documents' },
  { nom: 'COMPTABLE', description: 'Comptabilité : factures, créances, dettes, paiements' },
  { nom: 'CHAUFFEUR', description: 'Chauffeur : consultation des voyages et saisies terrain' },
  { nom: 'PERSONNALISE', description: 'Profil personnalisé — permissions définies au cas par cas' },
];

async function main() {
  // 1. Garantir les rôles
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { nom: role.nom },
      update: { description: role.description },
      create: role,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seed terminé : ${ROLES.length} rôles garantis.`);

  // 2. Garantir l'Administrateur Général (accès total à toute l'application).
  //    upsert => crée le compte s'il n'existe pas, sinon corrige rôle/statut/mot de passe.
  const adminEmail = 'walidaitaddi6@gmail.com';
  const adminRole = await prisma.role.findUnique({ where: { nom: 'ADMIN_GENERAL' } });
  if (!adminRole) {
    throw new Error("Rôle ADMIN_GENERAL introuvable dans la base de données.");
  }

  const hashedPassword = await bcrypt.hash('oualid200210', 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      nom: 'Oualid',
      idRole: adminRole.id,
      statut: 'ACTIF',
      motDePasse: hashedPassword,
    },
    create: {
      nom: 'Oualid',
      email: adminEmail,
      motDePasse: hashedPassword,
      idRole: adminRole.id,
      statut: 'ACTIF',
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Administrateur Général garanti : ${adminEmail} (profil ADMIN_GENERAL)`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
