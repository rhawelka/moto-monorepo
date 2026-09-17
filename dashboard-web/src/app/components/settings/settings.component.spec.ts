import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let transloco: TranslocoService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SettingsComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              settings: {
                title: 'Settings',
                language: 'Language',
                english: 'English',
                polish: 'Polish',
                theme: 'Theme',
                light: 'Light',
                dark: 'Dark',
              },
            },
            pl: {
              settings: {
                title: 'Ustawienia',
                language: 'Język',
                english: 'Angielski',
                polish: 'Polski',
                theme: 'Motyw',
                light: 'Jasny',
                dark: 'Ciemny',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en', 'pl'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();

    transloco = TestBed.inject(TranslocoService);
    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create with English selected by default', () => {
    expect(component).toBeTruthy();
    expect(component.activeLanguage()).toBe('en');
    expect(
      fixture.nativeElement.querySelector(
        '.settings-page__language-option--active',
      )?.textContent,
    ).toContain('English');
  });

  it('should switch to Polish when the Polish option is selected', async () => {
    component.changeLanguage('pl');
    await transloco.load('pl').toPromise();
    fixture.detectChanges();

    expect(component.activeLanguage()).toBe('pl');
    expect(
      fixture.nativeElement
        .querySelector('.settings-page__language-option--active')
        ?.getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('should switch back to English', async () => {
    component.changeLanguage('pl');
    await transloco.load('pl').toPromise();
    component.changeLanguage('en');
    await transloco.load('en').toPromise();
    fixture.detectChanges();

    expect(component.activeLanguage()).toBe('en');
  });

  it('should switch and persist the dark theme', () => {
    component.changeTheme('dark');

    expect(component.activeTheme()).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
