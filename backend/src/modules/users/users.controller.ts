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
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Utilisateurs')
@ApiBearerAuth()
@Roles('ADMIN_GENERAL')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un utilisateur (Administrateur Général uniquement)' })
  @ApiConflictResponse({ description: 'E-mail déjà utilisé' })
  @ApiBadRequestResponse({ description: 'Rôle inexistant / données invalides' })
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des utilisateurs (mini tableau de bord)' })
  stats() {
    return this.service.findStats();
  }

  @Get()
  @ApiOperation({ summary: 'Lister les utilisateurs (pagination, recherche, filtre statut)' })
  findAll(@Query() query: QueryUserDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d’un utilisateur' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  @ApiConflictResponse({ description: 'E-mail déjà utilisé' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un utilisateur' })
  @ApiNotFoundResponse({ description: 'Utilisateur introuvable' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
