import { Module } from '@nestjs/common';
import { GestionPaiementsController } from './gestion-paiements.controller';
import { GestionPaiementsService } from './gestion-paiements.service';

@Module({
  controllers: [GestionPaiementsController],
  providers: [GestionPaiementsService],
  exports: [GestionPaiementsService],
})
export class GestionPaiementsModule {}
