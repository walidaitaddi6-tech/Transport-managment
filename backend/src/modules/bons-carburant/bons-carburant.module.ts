import { Module } from '@nestjs/common';
import { BonsCarburantController } from './bons-carburant.controller';
import { BonsCarburantService } from './bons-carburant.service';

@Module({
  controllers: [BonsCarburantController],
  providers: [BonsCarburantService],
  exports: [BonsCarburantService],
})
export class BonsCarburantModule {}
