import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepensesAdministrativesService } from './depenses-administratives.service';

@ApiTags('Dépenses administratives')
@Controller('depenses-administratives')
export class DepensesAdministrativesController {
  constructor(private readonly service: DepensesAdministrativesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Dépenses administratives ».
}
