import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FournisseursService } from './fournisseurs.service';

@ApiTags('Fournisseurs')
@Controller('fournisseurs')
export class FournisseursController {
  constructor(private readonly service: FournisseursService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Fournisseurs ».
}
