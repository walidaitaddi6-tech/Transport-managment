import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { buildPaginationMeta, type PaginatedResult } from '../../common/dto/paginated-result';
import { normalizeMatrix } from '../../common/permissions/permissions';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

const SALT_ROUNDS = 10;

/** Champs exposés (le mot de passe n'est jamais renvoyé). */
const userSelect = {
  id: true,
  nom: true,
  email: true,
  telephone: true,
  statut: true,
  permissions: true,
  derniereConnexion: true,
  creeLe: true,
  idRole: true,
  role: { select: { id: true, nom: true } },
} satisfies Prisma.UserSelect;

type UserView = Prisma.UserGetPayload<{ select: typeof userSelect }>;

export interface UsersStats {
  total: number;
  actifs: number;
  inactifs: number;
  suspendus: number;
  parProfil: { profil: string; count: number }[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserView> {
    const motDePasse = await bcrypt.hash(dto.motDePasse, SALT_ROUNDS);
    const data: Prisma.UserUncheckedCreateInput = {
      nom: dto.nom,
      email: dto.email,
      telephone: dto.telephone,
      motDePasse,
      idRole: dto.idRole,
      statut: dto.statut,
    };
    if (dto.permissions !== undefined) {
      data.permissions = normalizeMatrix(dto.permissions) as unknown as Prisma.InputJsonValue;
    }
    try {
      return await this.prisma.user.create({ data, select: userSelect });
    } catch (error) {
      this.handleKnownErrors(error, dto.email);
      throw error;
    }
  }

  async findAll(query: QueryUserDto): Promise<PaginatedResult<UserView>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? 'id';
    const sortOrder = query.sortOrder ?? 'desc';

    const where: Prisma.UserWhereInput = {
      ...(query.statut ? { statut: query.statut } : {}),
      ...(query.search
        ? {
            OR: [
              { nom: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: userSelect,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  /**
   * Statistiques pour le mini tableau de bord de la page Utilisateurs.
   * (Simples `count` — sans groupBy — pour un typage stable avec Prisma.)
   */
  async findStats(): Promise<UsersStats> {
    const [total, actifs, inactifs, suspendus, roles] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { statut: 'ACTIF' } }),
      this.prisma.user.count({ where: { statut: 'INACTIF' } }),
      this.prisma.user.count({ where: { statut: 'SUSPENDU' } }),
      this.prisma.role.findMany({ select: { id: true, nom: true } }),
    ]);

    const parProfil = await Promise.all(
      roles.map(async (r) => ({
        profil: r.nom,
        count: await this.prisma.user.count({ where: { idRole: r.id } }),
      })),
    );

    return { total, actifs, inactifs, suspendus, parProfil };
  }

  async findOne(id: number): Promise<UserView> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    if (!user) {
      throw new NotFoundException(`Utilisateur #${id} introuvable`);
    }
    return user;
  }

  async update(id: number, dto: UpdateUserDto): Promise<UserView> {
    await this.findOne(id);
    const { motDePasse, permissions, ...rest } = dto;
    const data: Prisma.UserUncheckedUpdateInput = { ...rest };
    if (motDePasse) {
      data.motDePasse = await bcrypt.hash(motDePasse, SALT_ROUNDS);
    }
    if (permissions !== undefined) {
      data.permissions = normalizeMatrix(permissions) as unknown as Prisma.InputJsonValue;
    }
    try {
      return await this.prisma.user.update({ where: { id }, data, select: userSelect });
    } catch (error) {
      this.handleKnownErrors(error, dto.email);
      throw error;
    }
  }

  async remove(id: number): Promise<{ id: number }> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
    return { id };
  }

  /** Traduit les erreurs Prisma connues en exceptions HTTP explicites. */
  private handleKnownErrors(error: unknown, email?: string): void {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        throw new ConflictException(`L'e-mail « ${email} » est déjà utilisé`);
      }
      if (error.code === 'P2003') {
        throw new BadRequestException("Le rôle spécifié n'existe pas");
      }
    }
  }
}
