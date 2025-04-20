import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsEnum, MinLength, Matches } from 'class-validator';

enum UserRole {
  admin = 'admin',
  gudang = 'user',
  Kasir = 'manager'
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'Username can only contain letters, numbers, underscores, and hyphens'
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be either "admin", "user", or "manager"'
  })
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}