import { Module } from '@nestjs/common';
import { DocumentsVehiculesController } from './documents-vehicules.controller';
import { DocumentsVehiculesService } from './documents-vehicules.service';

@Module({
  controllers: [DocumentsVehiculesController],
  providers: [DocumentsVehiculesService],
  exports: [DocumentsVehiculesService],
})
export class DocumentsVehiculesModule {}
