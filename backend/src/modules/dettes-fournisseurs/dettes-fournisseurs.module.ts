import { Module } from '@nestjs/common';
import { DettesFournisseursController } from './dettes-fournisseurs.controller';
import { DettesFournisseursService } from './dettes-fournisseurs.service';

@Module({
  controllers: [DettesFournisseursController],
  providers: [DettesFournisseursService],
  exports: [DettesFournisseursService],
})
export class DettesFournisseursModule {}
