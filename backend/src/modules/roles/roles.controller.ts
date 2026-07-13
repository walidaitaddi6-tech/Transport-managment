import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';

@ApiTags('Rôles')
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Rôles ».
}
