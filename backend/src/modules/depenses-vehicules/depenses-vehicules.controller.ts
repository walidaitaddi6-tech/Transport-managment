import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepensesVehiculesService } from './depenses-vehicules.service';

@ApiTags('Dépenses véhicules')
@Controller('depenses-vehicules')
export class DepensesVehiculesController {
  constructor(private readonly service: DepensesVehiculesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Dépenses véhicules ».
}
