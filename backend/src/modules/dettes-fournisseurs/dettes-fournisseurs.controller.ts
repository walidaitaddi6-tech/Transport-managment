import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DettesFournisseursService } from './dettes-fournisseurs.service';

@ApiTags('Dettes fournisseurs')
@Controller('dettes-fournisseurs')
export class DettesFournisseursController {
  constructor(private readonly service: DettesFournisseursService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Dettes fournisseurs ».
}
