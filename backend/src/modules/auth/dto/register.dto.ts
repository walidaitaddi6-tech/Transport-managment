import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Nadia Fassi', description: 'Nom complet' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom est requis' })
  @MaxLength(120)
  nom!: string;

  @ApiProperty({ example: 'nadia@transport.ma', description: 'E-mail' })
  @IsEmail({}, { message: 'E-mail invalide' })
  @MaxLength(190)
  email!: string;

  @ApiProperty({ example: 'Passw0rd!', minLength: 6, description: 'Mot de passe' })
  @IsString()
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  @MaxLength(72)
  password!: string;
}
