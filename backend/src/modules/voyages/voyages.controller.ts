import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { VoyagesService } from './voyages.service';

@ApiTags('Voyages')
@Controller('voyages')
export class VoyagesController {
  constructor(private readonly service: VoyagesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Voyages ».
}
