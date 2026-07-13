import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VehiculesService } from './vehicules.service';

@ApiTags('Véhicules')
@Controller('vehicules')
export class VehiculesController {
  constructor(private readonly service: VehiculesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Véhicules ».
}
