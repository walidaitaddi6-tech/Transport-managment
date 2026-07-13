import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaiementsClientsService } from './paiements-clients.service';

@ApiTags('Paiements clients')
@Controller('paiements-clients')
export class PaiementsClientsController {
  constructor(private readonly service: PaiementsClientsService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Paiements clients ».
}
