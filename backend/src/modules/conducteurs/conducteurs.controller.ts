import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConducteursService } from './conducteurs.service';

@ApiTags('Conducteurs')
@Controller('conducteurs')
export class ConducteursController {
  constructor(private readonly service: ConducteursService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Conducteurs ».
}
