import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { provideRouter } from '@angular/router';
import { Sidebar } from './sidebar';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        Sidebar,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {},
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the default navigation items and settings footer config', () => {
    expect(component.navItems).toEqual([
      { label: 'overview', icon: 'dashboard', route: '/dashboard' },
      { label: 'reports', icon: 'bar_chart', route: '/dashboard' },
    ]);
    expect(component.settingsItem).toEqual({
      label: 'settings',
      icon: 'settings',
      route: '/dashboard/settings',
    });
    expect(component.expanded).toBe(true);
  });

  it('should toggle the expanded state', () => {
    component.toggle();
    expect(component.expanded).toBe(false);

    component.toggle();
    expect(component.expanded).toBe(true);
  });

  it('should accept custom nav items and settings values when inputs are provided', () => {
    component.navItems = [
      { label: 'Inbox', icon: 'inbox', route: '/inbox' },
      { label: 'Archive', icon: 'archive', route: '/archive' },
    ];
    component.settingsItem = {
      label: 'Preferences',
      icon: 'tune',
      route: '/preferences',
    };
    fixture.detectChanges();

    expect(component.navItems).toEqual([
      { label: 'Inbox', icon: 'inbox', route: '/inbox' },
      { label: 'Archive', icon: 'archive', route: '/archive' },
    ]);
    expect(component.settingsItem).toEqual({
      label: 'Preferences',
      icon: 'tune',
      route: '/preferences',
    });
  });
});
