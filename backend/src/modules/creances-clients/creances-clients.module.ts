import { Module } from '@nestjs/common';
import { CreancesClientsController } from './creances-clients.controller';
import { CreancesClientsService } from './creances-clients.service';

@Module({
  controllers: [CreancesClientsController],
  providers: [CreancesClientsService],
  exports: [CreancesClientsService],
})
export class CreancesClientsModule {}
