import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DocumentsVehiculesService } from './documents-vehicules.service';

@ApiTags('Documents véhicules')
@Controller('documents-vehicules')
export class DocumentsVehiculesController {
  constructor(private readonly service: DocumentsVehiculesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Documents véhicules ».
}
