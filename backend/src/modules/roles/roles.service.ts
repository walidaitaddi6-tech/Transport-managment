import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, type PaginatedResult } from '../../common/dto/paginated-result';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { QueryRoleDto } from './dto/query-role.dto';

type Role = { id: number; nom: string; description: string | null };

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    try {
      return await this.prisma.role.create({ data: dto });
    } catch (error) {
      this.handleKnownErrors(error, dto.nom);
      throw error;
    }
  }

  async findAll(query: QueryRoleDto): Promise<PaginatedResult<Role>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'id';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.RoleWhereInput = query.search
      ? {
          OR: [
            { nom: { contains: query.search, mode: 'insensitive' } },
            { description: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.role.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.role.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findOne(id: number): Promise<Role> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      throw new NotFoundException(`Rôle #${id} introuvable`);
    }
    return role;
  }

  async update(id: number, dto: UpdateRoleDto): Promise<Role> {
    await this.findOne(id);
    try {
      return await this.prisma.role.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleKnownErrors(error, dto.nom);
      throw error;
    }
  }

  async remove(id: number): Promise<{ id: number }> {
    await this.findOne(id);
    try {
      await this.prisma.role.delete({ where: { id } });
      return { id };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ConflictException(
          'Ce rôle est attribué à des utilisateurs et ne peut pas être supprimé',
        );
      }
      throw error;
    }
  }

  /** Traduit les erreurs Prisma connues en exceptions HTTP explicites. */
  private handleKnownErrors(error: unknown, nom?: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException(`Un rôle nommé « ${nom} » existe déjà`);
    }
  }
}
