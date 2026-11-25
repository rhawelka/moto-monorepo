import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { AccessDeniedComponent } from './access-denied.component';

describe('AccessDeniedComponent', () => {
  let fixture: ComponentFixture<AccessDeniedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AccessDeniedComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              accessDenied: {
                title: 'Access denied',
                message: 'Your account does not have permission to view this page.',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccessDeniedComponent);
    fixture.detectChanges();
  });

  it('renders the translated message in the main landmark', () => {
    const main: HTMLElement | null =
      fixture.nativeElement.querySelector('main');

    expect(main).not.toBeNull();
    expect(main?.querySelector('h1')?.textContent?.trim()).toBe(
      'Access denied',
    );
    expect(main?.querySelector('p')?.textContent?.trim()).toBe(
      'Your account does not have permission to view this page.',
    );
  });
});
