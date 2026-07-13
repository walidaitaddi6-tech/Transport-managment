import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class GestionPaiementsService {
  constructor(private readonly prisma: PrismaService) {}

  // TODO (étape ultérieure) : implémenter la logique métier « Gestion des paiements ».
}
