import { Module } from '@nestjs/common';
import { DepensesVehiculesController } from './depenses-vehicules.controller';
import { DepensesVehiculesService } from './depenses-vehicules.service';

@Module({
  controllers: [DepensesVehiculesController],
  providers: [DepensesVehiculesService],
  exports: [DepensesVehiculesService],
})
export class DepensesVehiculesModule {}
