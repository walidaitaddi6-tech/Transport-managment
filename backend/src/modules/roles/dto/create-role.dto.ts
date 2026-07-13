import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPERVISEUR', maxLength: 50, description: 'Nom unique du rôle' })
  @IsString()
  @IsNotEmpty({ message: 'Le nom du rôle est requis' })
  @MaxLength(50, { message: 'Le nom ne doit pas dépasser 50 caractères' })
  nom!: string;

  @ApiPropertyOptional({ maxLength: 255, description: 'Description du rôle' })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'La description ne doit pas dépasser 255 caractères' })
  description?: string;
}
