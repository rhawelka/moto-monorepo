import { IncidentSeverity, IncidentStatus } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateIncidentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(5)
  @MaxLength(120)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(20)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MinLength(2)
  @MaxLength(160)
  location!: string;

  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsEnum(IncidentStatus)
  status!: IncidentStatus;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;
}
