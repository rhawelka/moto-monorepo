import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { AdminSettingsDto } from './admin-settings.dto';

describe('AdminSettingsDto', () => {
  const validSettings = {
    mapCenter: { latitude: 50, longitude: 19, zoom: 11 },
    zones: [{ name: 'Central', latitude: 50, longitude: 19, radiusKm: 2 }],
    alertTypes: [{ name: 'Road hazard', severity: 'HIGH', enabled: true }],
  };

  it('accepts valid settings with nested zones and alert types', async () => {
    const dto = plainToInstance(AdminSettingsDto, validSettings);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid coordinates, zoom levels, and duplicate alert names', async () => {
    const dto = plainToInstance(AdminSettingsDto, {
      ...validSettings,
      mapCenter: { latitude: 91, longitude: 19, zoom: 25 },
      alertTypes: [
        { name: 'Road hazard', severity: 'HIGH', enabled: true },
        { name: ' road HAZARD ', severity: 'LOW', enabled: false },
      ],
    });

    const errors = await validate(dto);

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(['mapCenter', 'alertTypes']),
    );
  });
});
