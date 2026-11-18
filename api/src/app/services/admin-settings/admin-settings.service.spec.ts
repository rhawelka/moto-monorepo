import { IncidentSeverity } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AdminSettingsDto } from '../../controllers/admin-settings/admin-settings.dto';
import { AdminSettingsService } from './admin-settings.service';

describe('AdminSettingsService', () => {
  const now = new Date('2026-01-01T00:00:00.000Z');
  const record = {
    mapCenterLatitude: 50.0614,
    mapCenterLongitude: 19.9366,
    mapZoom: 11,
    updatedAt: now,
    mapZones: [],
    alertTypes: [
      {
        id: 'alert-id',
        name: 'High',
        severity: IncidentSeverity.HIGH,
        enabled: true,
      },
    ],
  };
  let prisma: {
    adminSettings: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };
  let service: AdminSettingsService;

  beforeEach(() => {
    prisma = {
      adminSettings: {
        upsert: jest.fn().mockResolvedValue(record),
      },
      $transaction: jest.fn(),
    };
    service = new AdminSettingsService(prisma as unknown as PrismaService);
  });

  it('creates default settings on first read and returns their public shape', async () => {
    await expect(service.getSettings()).resolves.toEqual({
      mapCenter: { latitude: 50.0614, longitude: 19.9366, zoom: 11 },
      zones: [],
      alertTypes: record.alertTypes,
      updatedAt: now,
    });
    expect(prisma.adminSettings.upsert).toHaveBeenCalledWith({
      where: { id: 1 },
      create: {
        id: 1,
        alertTypes: {
          create: [
            { name: 'Low', severity: IncidentSeverity.LOW, enabled: true },
            {
              name: 'Medium',
              severity: IncidentSeverity.MEDIUM,
              enabled: true,
            },
            { name: 'High', severity: IncidentSeverity.HIGH, enabled: true },
            {
              name: 'Critical',
              severity: IncidentSeverity.CRITICAL,
              enabled: true,
            },
          ],
        },
      },
      update: {},
      include: expect.any(Object),
    });
  });

  it('replaces zones and alert types in a transaction when saving', async () => {
    const savedRecord = {
      ...record,
      mapCenterLatitude: 51,
      mapCenterLongitude: 20,
      mapZoom: 12,
      mapZones: [
        {
          id: 'zone-id',
          name: 'Central',
          latitude: 51,
          longitude: 20,
          radiusKm: 2,
        },
      ],
    };
    const transaction = {
      adminSettings: {
        upsert: jest.fn().mockResolvedValue(savedRecord),
        findUniqueOrThrow: jest.fn().mockResolvedValue(savedRecord),
      },
      mapZone: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      alertType: {
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(
      (callback: (tx: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
    );
    const update = {
      mapCenter: { latitude: 51, longitude: 20, zoom: 12 },
      zones: [{ name: 'Central', latitude: 51, longitude: 20, radiusKm: 2 }],
      alertTypes: [
        {
          name: 'Road closure',
          severity: IncidentSeverity.HIGH,
          enabled: true,
        },
      ],
    } satisfies AdminSettingsDto;

    await expect(service.updateSettings(update)).resolves.toMatchObject({
      mapCenter: { latitude: 51, longitude: 20, zoom: 12 },
      zones: savedRecord.mapZones,
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.mapZone.deleteMany).toHaveBeenCalledWith({
      where: { settingsId: 1 },
    });
    expect(transaction.mapZone.createMany).toHaveBeenCalledWith({
      data: [{ ...update.zones[0], settingsId: 1 }],
    });
    expect(transaction.alertType.deleteMany).toHaveBeenCalledWith({
      where: { settingsId: 1 },
    });
    expect(transaction.alertType.createMany).toHaveBeenCalledWith({
      data: [{ ...update.alertTypes[0], settingsId: 1 }],
    });
  });
});
