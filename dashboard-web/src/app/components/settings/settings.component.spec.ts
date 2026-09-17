import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoService, TranslocoTestingModule } from '@jsverse/transloco';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let transloco: TranslocoService;

  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');

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

  it('should switch back to and persist the light theme', () => {
    component.changeTheme('dark');
    component.changeTheme('light');

    expect(component.activeTheme()).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('should restore the stored dark theme when initialized', () => {
    localStorage.setItem('theme', 'dark');

    const storedThemeFixture = TestBed.createComponent(SettingsComponent);
    const storedThemeComponent = storedThemeFixture.componentInstance;

    expect(storedThemeComponent.activeTheme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');

    storedThemeFixture.destroy();
  });

  it('should fall back to light for an unsupported stored theme', () => {
    localStorage.setItem('theme', 'blue');

    const storedThemeFixture = TestBed.createComponent(SettingsComponent);
    const storedThemeComponent = storedThemeFixture.componentInstance;

    expect(storedThemeComponent.activeTheme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');

    storedThemeFixture.destroy();
  });

  it('should change the theme from the rendered controls', () => {
    const darkButton = fixture.nativeElement.querySelector(
      '.settings-page__theme button:last-child',
    ) as HTMLButtonElement;

    darkButton.click();
    fixture.detectChanges();

    expect(component.activeTheme()).toBe('dark');
    expect(darkButton.getAttribute('aria-pressed')).toBe('true');
    expect(
      fixture.nativeElement.querySelector(
        '.settings-page__theme-option--active',
      ),
    ).toBe(darkButton);
  });
});
