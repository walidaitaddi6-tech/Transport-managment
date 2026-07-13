import { Module } from '@nestjs/common';
import { DepensesAdministrativesController } from './depenses-administratives.controller';
import { DepensesAdministrativesService } from './depenses-administratives.service';

@Module({
  controllers: [DepensesAdministrativesController],
  providers: [DepensesAdministrativesService],
  exports: [DepensesAdministrativesService],
})
export class DepensesAdministrativesModule {}
