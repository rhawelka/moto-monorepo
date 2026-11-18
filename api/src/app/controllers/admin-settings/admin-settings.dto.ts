import { IncidentSeverity } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsObject,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class MapCenterDto {
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsInt()
  @Min(1)
  @Max(20)
  zoom!: number;
}

export class MapZoneDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  name!: string;

  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;

  @IsNumber()
  @Min(0.1)
  @Max(1000)
  radiusKm!: number;
}

export class AlertTypeDto {
  @IsString()
  @Matches(/\S/)
  @MaxLength(80)
  name!: string;

  @IsEnum(IncidentSeverity)
  severity!: IncidentSeverity;

  @IsBoolean()
  enabled!: boolean;
}

export class AdminSettingsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => MapCenterDto)
  mapCenter!: MapCenterDto;

  @IsArray()
  @ArrayMaxSize(50)
  @ArrayUnique((zone: MapZoneDto) => zone?.name?.trim().toLocaleLowerCase())
  @ValidateNested({ each: true })
  @Type(() => MapZoneDto)
  zones!: MapZoneDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique((alertType: AlertTypeDto) =>
    alertType?.name?.trim().toLocaleLowerCase(),
  )
  @ValidateNested({ each: true })
  @Type(() => AlertTypeDto)
  alertTypes!: AlertTypeDto[];
}
