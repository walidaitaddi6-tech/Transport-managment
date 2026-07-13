import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaiementsFournisseursService } from './paiements-fournisseurs.service';

@ApiTags('Paiements fournisseurs')
@Controller('paiements-fournisseurs')
export class PaiementsFournisseursController {
  constructor(private readonly service: PaiementsFournisseursService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Paiements fournisseurs ».
}
