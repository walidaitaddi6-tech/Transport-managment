import { Module } from '@nestjs/common';
import { PaiementsClientsController } from './paiements-clients.controller';
import { PaiementsClientsService } from './paiements-clients.service';

@Module({
  controllers: [PaiementsClientsController],
  providers: [PaiementsClientsService],
  exports: [PaiementsClientsService],
})
export class PaiementsClientsModule {}
