import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class QueryRoleDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Recherche sur le nom ou la description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['id', 'nom'], default: 'id', description: 'Champ de tri' })
  @IsOptional()
  @IsIn(['id', 'nom'])
  sortBy?: 'id' | 'nom' = 'id';
}
