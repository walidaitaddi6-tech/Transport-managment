import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FacturesService } from './factures.service';

@ApiTags('Factures')
@Controller('factures')
export class FacturesController {
  constructor(private readonly service: FacturesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Factures ».
}
