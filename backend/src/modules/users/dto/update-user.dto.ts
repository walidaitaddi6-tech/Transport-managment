import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/** Tous les champs deviennent optionnels (mot de passe inclus : omis = inchangé). */
export class UpdateUserDto extends PartialType(CreateUserDto) {}
