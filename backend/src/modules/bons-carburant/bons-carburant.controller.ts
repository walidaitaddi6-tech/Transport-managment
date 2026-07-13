import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BonsCarburantService } from './bons-carburant.service';

@ApiTags('Bons carburant')
@Controller('bons-carburant')
export class BonsCarburantController {
  constructor(private readonly service: BonsCarburantService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Bons carburant ».
}
