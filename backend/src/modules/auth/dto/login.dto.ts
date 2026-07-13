import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@transport.ma', description: 'E-mail de connexion' })
  @IsEmail({}, { message: 'E-mail invalide' })
  email!: string;

  @ApiProperty({ example: 'Passw0rd!', minLength: 6, description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password!: string;
}
