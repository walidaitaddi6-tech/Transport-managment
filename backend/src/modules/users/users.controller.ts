import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('Utilisateurs')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // TODO (étape ultérieure) : endpoints CRUD « Utilisateurs ».
}
