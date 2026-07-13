import { Module } from '@nestjs/common';
import { DocumentsConducteursController } from './documents-conducteurs.controller';
import { DocumentsConducteursService } from './documents-conducteurs.service';

@Module({
  controllers: [DocumentsConducteursController],
  providers: [DocumentsConducteursService],
  exports: [DocumentsConducteursService],
})
export class DocumentsConducteursModule {}
