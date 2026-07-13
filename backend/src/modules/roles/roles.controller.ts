import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Rôles')
@ApiBearerAuth()
@Controller('roles')
export class RolesController {
  constructor(private readonly service: RolesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Créer un rôle' })
  @ApiConflictResponse({ description: 'Nom de rôle déjà existant' })
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les rôles (pagination + recherche)' })
  findAll(@Query() query: QueryRoleDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un rôle' })
  @ApiNotFoundResponse({ description: 'Rôle introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Modifier un rôle' })
  @ApiNotFoundResponse({ description: 'Rôle introuvable' })
  @ApiConflictResponse({ description: 'Nom de rôle déjà existant' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Supprimer un rôle' })
  @ApiNotFoundResponse({ description: 'Rôle introuvable' })
  @ApiConflictResponse({ description: 'Rôle utilisé par des utilisateurs' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
