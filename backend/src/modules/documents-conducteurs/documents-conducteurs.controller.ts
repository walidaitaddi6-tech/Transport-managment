import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsConducteursService } from './documents-conducteurs.service';

@ApiTags('Documents conducteurs')
@Controller('documents-conducteurs')
export class DocumentsConducteursController {
  constructor(private readonly service: DocumentsConducteursService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Documents conducteurs ».
}
