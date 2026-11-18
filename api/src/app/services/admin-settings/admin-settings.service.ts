import { Injectable } from '@nestjs/common';
import { IncidentSeverity } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdminSettingsDto } from '../../controllers/admin-settings/admin-settings.dto';

const SETTINGS_ID = 1;

const DEFAULT_ALERT_TYPES = [
  { name: 'Low', severity: IncidentSeverity.LOW, enabled: true },
  { name: 'Medium', severity: IncidentSeverity.MEDIUM, enabled: true },
  { name: 'High', severity: IncidentSeverity.HIGH, enabled: true },
  { name: 'Critical', severity: IncidentSeverity.CRITICAL, enabled: true },
];

const SETTINGS_INCLUDE = {
  mapZones: {
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      radiusKm: true,
    },
    orderBy: { name: 'asc' as const },
  },
  alertTypes: {
    select: { id: true, name: true, severity: true, enabled: true },
    orderBy: { name: 'asc' as const },
  },
};

@Injectable()
export class AdminSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.adminSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        alertTypes: { create: DEFAULT_ALERT_TYPES },
      },
      update: {},
      include: SETTINGS_INCLUDE,
    });

    return this.toResponse(settings);
  }

  async updateSettings(dto: AdminSettingsDto) {
    const settings = await this.prisma.$transaction(async (transaction) => {
      await transaction.adminSettings.upsert({
        where: { id: SETTINGS_ID },
        create: {
          id: SETTINGS_ID,
          mapCenterLatitude: dto.mapCenter.latitude,
          mapCenterLongitude: dto.mapCenter.longitude,
          mapZoom: dto.mapCenter.zoom,
        },
        update: {
          mapCenterLatitude: dto.mapCenter.latitude,
          mapCenterLongitude: dto.mapCenter.longitude,
          mapZoom: dto.mapCenter.zoom,
        },
      });

      await transaction.mapZone.deleteMany({
        where: { settingsId: SETTINGS_ID },
      });
      await transaction.alertType.deleteMany({
        where: { settingsId: SETTINGS_ID },
      });

      if (dto.zones.length > 0) {
        await transaction.mapZone.createMany({
          data: dto.zones.map((zone) => ({
            ...zone,
            settingsId: SETTINGS_ID,
          })),
        });
      }

      await transaction.alertType.createMany({
        data: dto.alertTypes.map((alertType) => ({
          ...alertType,
          settingsId: SETTINGS_ID,
        })),
      });

      return transaction.adminSettings.findUniqueOrThrow({
        where: { id: SETTINGS_ID },
        include: SETTINGS_INCLUDE,
      });
    });

    return this.toResponse(settings);
  }

  private toResponse(settings: {
    mapCenterLatitude: number;
    mapCenterLongitude: number;
    mapZoom: number;
    updatedAt: Date;
    mapZones: {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      radiusKm: number;
    }[];
    alertTypes: {
      id: string;
      name: string;
      severity: IncidentSeverity;
      enabled: boolean;
    }[];
  }) {
    return {
      mapCenter: {
        latitude: settings.mapCenterLatitude,
        longitude: settings.mapCenterLongitude,
        zoom: settings.mapZoom,
      },
      zones: settings.mapZones,
      alertTypes: settings.alertTypes,
      updatedAt: settings.updatedAt,
    };
  }
}
