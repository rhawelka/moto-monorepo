import {
  GUARDS_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';
import { IncidentSeverity } from '@prisma/client';
import { AdminGuard } from '../../services/admin.guard';
import { AdminSettingsService } from '../../services/admin-settings/admin-settings.service';
import { AdminSettingsController } from './admin-settings.controller';

describe('AdminSettingsController', () => {
  const settings = {
    mapCenter: { latitude: 50, longitude: 19, zoom: 11 },
    zones: [],
    alertTypes: [],
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
  const service = {
    getSettings: jest.fn().mockResolvedValue(settings),
    updateSettings: jest.fn().mockResolvedValue(settings),
  };
  let controller: AdminSettingsController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new AdminSettingsController(
      service as unknown as AdminSettingsService,
    );
  });

  it('requires JWT authentication and admin privileges to update settings', () => {
    expect(Reflect.getMetadata(PATH_METADATA, AdminSettingsController)).toBe(
      'admin/settings',
    );
    expect(
      Reflect.getMetadata(GUARDS_METADATA, AdminSettingsController),
    ).toEqual([expect.any(Function)]);
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        AdminSettingsController.prototype.getSettings,
      ),
    ).toBe(0);
    expect(
      Reflect.getMetadata(
        GUARDS_METADATA,
        AdminSettingsController.prototype.updateSettings,
      ),
    ).toContain(AdminGuard);
    expect(
      Reflect.getMetadata(
        METHOD_METADATA,
        AdminSettingsController.prototype.updateSettings,
      ),
    ).toBe(4);
  });

  it('returns the saved global settings', async () => {
    await expect(controller.getSettings()).resolves.toBe(settings);
    expect(service.getSettings).toHaveBeenCalledTimes(1);
  });

  it('passes validated settings to the service for persistence', async () => {
    const update = {
      mapCenter: { latitude: 50, longitude: 19, zoom: 12 },
      zones: [],
      alertTypes: [
        {
          name: 'Road closure',
          severity: IncidentSeverity.HIGH,
          enabled: true,
        },
      ],
    };

    await expect(controller.updateSettings(update)).resolves.toBe(settings);
    expect(service.updateSettings).toHaveBeenCalledWith(update);
  });
});
