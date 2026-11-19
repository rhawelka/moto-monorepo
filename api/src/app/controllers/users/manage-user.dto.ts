import { Role, UserPermission, UserStatus } from '@prisma/client';
import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from '@moto-monorepo/dto';

export class CreateManagedUserDto extends CreateUserDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(UserPermission, { each: true })
  permissions?: UserPermission[];
}

export class UpdateManagedUserDto {
  @IsOptional()
  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  username?: string | null;

  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsEnum(UserPermission, { each: true })
  permissions?: UserPermission[];
}
