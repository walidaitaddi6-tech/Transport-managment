import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty() id!: number;
  @ApiProperty() nom!: string;
  @ApiProperty() email!: string;
  @ApiProperty({ example: 'ADMIN_GENERAL' }) role!: string;
}

export class AuthTokensDto {
  @ApiProperty({ description: 'JWT access token (courte durée)' })
  accessToken!: string;

  @ApiProperty({ description: 'JWT refresh token (longue durée)' })
  refreshToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
