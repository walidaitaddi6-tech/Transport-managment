/**
 * Seed Prisma — insère les rôles applicatifs par défaut.
 * Idempotent : peut être rejoué sans créer de doublons.
 *
 * Exécution : npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES: { nom: string; description: string }[] = [
  { nom: 'ADMIN', description: 'Administrateur système, accès total' },
  { nom: 'GESTIONNAIRE', description: 'Gestion opérationnelle : voyages, véhicules, conducteurs, clients' },
  { nom: 'COMPTABLE', description: 'Facturation, créances, dettes et comptabilité' },
  { nom: 'OPERATEUR', description: 'Saisie et suivi des voyages' },
  { nom: 'CONDUCTEUR', description: 'Application mobile conducteur' },
];

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { nom: role.nom },
      update: { description: role.description },
      create: role,
    });
  }
  // eslint-disable-next-line no-console
  console.log(`Seed terminé : ${ROLES.length} rôles garantis.`);
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
