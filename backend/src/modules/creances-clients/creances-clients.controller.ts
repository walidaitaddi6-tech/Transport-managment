import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreancesClientsService } from './creances-clients.service';

@ApiTags('Créances clients')
@Controller('creances-clients')
export class CreancesClientsController {
  constructor(private readonly service: CreancesClientsService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Créances clients ».
}
