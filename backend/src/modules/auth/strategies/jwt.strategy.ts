import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

/** Contenu du token JWT (payload signé). */
export interface JwtPayload {
  sub: number; // id utilisateur
  email: string;
  role: string;
}

/** Utilisateur authentifié attaché à request.user. */
export interface AuthenticatedUser {
  sub: number;
  email: string;
  role: string;
  nom: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret') as string,
    });
  }

  /** Valide le token : l'utilisateur doit exister et être ACTIF. */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });
    if (!user || user.statut !== 'ACTIF') {
      throw new UnauthorizedException('Session invalide');
    }
    return { sub: user.id, email: user.email, role: user.role.nom, nom: user.nom };
  }
}
