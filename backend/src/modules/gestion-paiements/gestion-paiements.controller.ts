import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GestionPaiementsService } from './gestion-paiements.service';

@ApiTags('Gestion des paiements')
@Controller('gestion-paiements')
export class GestionPaiementsController {
  constructor(private readonly service: GestionPaiementsService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Gestion des paiements ».
}
