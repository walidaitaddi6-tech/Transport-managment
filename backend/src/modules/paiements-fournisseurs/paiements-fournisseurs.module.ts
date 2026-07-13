import { Module } from '@nestjs/common';
import { PaiementsFournisseursController } from './paiements-fournisseurs.controller';
import { PaiementsFournisseursService } from './paiements-fournisseurs.service';

@Module({
  controllers: [PaiementsFournisseursController],
  providers: [PaiementsFournisseursService],
  exports: [PaiementsFournisseursService],
})
export class PaiementsFournisseursModule {}
