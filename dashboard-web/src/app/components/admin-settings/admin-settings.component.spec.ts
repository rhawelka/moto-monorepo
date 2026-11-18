import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import {
  AdminSettings,
  AdminSettingsService,
  AdminSettingsUpdate,
} from '../../services/admin-settings/admin-settings.service';
import { AdminSettingsComponent } from './admin-settings.component';

describe('AdminSettingsComponent', () => {
  const settings: AdminSettings = {
    mapCenter: { latitude: 50.0614, longitude: 19.9366, zoom: 11 },
    zones: [
      {
        id: 'zone-1',
        name: 'Central',
        latitude: 50.0614,
        longitude: 19.9366,
        radiusKm: 2,
      },
    ],
    alertTypes: [
      {
        id: 'alert-1',
        name: 'Road hazard',
        severity: 'HIGH',
        enabled: true,
      },
    ],
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  let fixture: ComponentFixture<AdminSettingsComponent>;
  let settingsService: jest.Mocked<
    Pick<AdminSettingsService, 'getSettings' | 'updateSettings'>
  >;

  beforeEach(async () => {
    settingsService = {
      getSettings: jest.fn().mockReturnValue(of(settings)),
      updateSettings: jest.fn().mockReturnValue(of(settings)),
    };

    await TestBed.configureTestingModule({
      imports: [
        AdminSettingsComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              adminSettings: {
                title: 'Global settings',
                loading: 'Loading',
                loadError: 'Load failed',
                saveError: 'Save failed',
                saved: 'Saved',
                save: 'Save settings',
                saving: 'Saving',
                mapCenterTitle: 'Live map',
                mapCenterDescription: 'Default center',
                latitude: 'Latitude',
                longitude: 'Longitude',
                zoom: 'Zoom',
                mapCenterValidation: 'Invalid map center',
                zonesTitle: 'Map zones',
                zonesDescription: 'Configured zones',
                addZone: 'Add zone',
                zone: 'Zone',
                name: 'Name',
                radiusKm: 'Radius (km)',
                remove: 'Remove',
                noZones: 'No zones',
                zoneValidation: 'Invalid zone',
                alertTypesTitle: 'Alert types',
                alertTypesDescription: 'Configured alert types',
                addAlertType: 'Add alert type',
                alertType: 'Alert type',
                severity: 'Severity',
                enabled: 'Enabled',
                alertTypeValidation: 'Invalid alert type',
                atLeastOneAlertType: 'At least one alert type is required',
                severity_LOW: 'Low',
                severity_MEDIUM: 'Medium',
                severity_HIGH: 'High',
                severity_CRITICAL: 'Critical',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [{ provide: AdminSettingsService, useValue: settingsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('loads persisted map, zone, and alert settings into the form', () => {
    const component = fixture.componentInstance;

    expect(component.loading()).toBe(false);
    expect(component.mapCenter.getRawValue()).toEqual(settings.mapCenter);
    expect(component.zones.length).toBe(1);
    expect(component.alertTypes.length).toBe(1);
    expect(component.form.valid).toBe(true);
  });

  it('supports adding and removing map zones and alert types', () => {
    const component = fixture.componentInstance;

    component.addZone();
    component.addAlertType();
    expect(component.zones.length).toBe(2);
    expect(component.alertTypes.length).toBe(2);

    component.removeZone(0);
    component.removeAlertType(0);
    expect(component.zones.length).toBe(1);
    expect(component.alertTypes.length).toBe(1);
  });

  it('does not save invalid coordinates or an empty alert type list', () => {
    const component = fixture.componentInstance;
    component.mapCenter.controls.latitude.setValue(91);
    component.removeAlertType(0);

    component.submit();

    expect(component.form.touched).toBe(true);
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('rejects duplicate zone and alert type names before saving', () => {
    const component = fixture.componentInstance;
    component.addZone();
    component.zones.at(1).controls.name.setValue('central');
    component.addAlertType();
    component.alertTypes.at(1).controls.name.setValue('ROAD HAZARD');

    component.submit();

    expect(component.zones.hasError('duplicateName')).toBe(true);
    expect(component.alertTypes.hasError('duplicateName')).toBe(true);
    expect(settingsService.updateSettings).not.toHaveBeenCalled();
  });

  it('persists valid settings and confirms success', () => {
    const component = fixture.componentInstance;
    const feedback = fixture.nativeElement.querySelector(
      '.form-feedback',
    ) as HTMLDivElement;
    const successMessage = feedback.querySelector(
      '[role="status"]',
    ) as HTMLParagraphElement;
    const expectedUpdate: AdminSettingsUpdate = {
      mapCenter: settings.mapCenter,
      zones: settings.zones.map(({ name, latitude, longitude, radiusKm }) => ({
        name,
        latitude,
        longitude,
        radiusKm,
      })),
      alertTypes: settings.alertTypes.map(({ name, severity, enabled }) => ({
        name,
        severity,
        enabled,
      })),
    };

    component.submit();

    expect(settingsService.updateSettings).toHaveBeenCalledWith(expectedUpdate);
    expect(component.saved()).toBe(true);
    expect(component.saving()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.form-feedback')).toBe(
      feedback,
    );
    expect(successMessage.hidden).toBe(false);
  });

  it('displays an alert when settings fail to load', async () => {
    fixture.destroy();
    settingsService.getSettings.mockReturnValue(
      throwError(() => new Error('API unavailable')),
    );
    fixture = TestBed.createComponent(AdminSettingsComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.loadFailed()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('Load failed');
  });

  it('displays an alert when saving settings fails', () => {
    settingsService.updateSettings.mockReturnValue(
      throwError(() => new Error('API unavailable')),
    );

    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.saveFailed()).toBe(true);
    expect(fixture.componentInstance.saving()).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('Save failed');
  });
});
