import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let authService: { logout: jest.Mock };

  beforeEach(async () => {
    authService = {
      logout: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle the sidenav from the footer control', () => {
    const toggleButton = fixture.nativeElement.querySelector(
      '.ui-sidebar__toggle',
    ) as HTMLButtonElement;

    expect(
      fixture.nativeElement.querySelector('.ui-sidebar__toggle-label')
        ?.textContent,
    ).toContain('Collapse');

    toggleButton.click();
    fixture.detectChanges();

    expect(toggleButton.getAttribute('aria-label')).toBe('Expand navigation');
    expect(
      fixture.nativeElement.querySelector('.ui-sidebar--collapsed'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.ui-sidebar__toggle-label'),
    ).toBeNull();
  });

  it('should expand the sidenav after toggling twice', () => {
    const toggleButton = fixture.nativeElement.querySelector(
      '.ui-sidebar__toggle',
    ) as HTMLButtonElement;

    toggleButton.click();
    toggleButton.click();

    expect(
      fixture.nativeElement.querySelector('.ui-sidebar--collapsed'),
    ).toBeNull();
  });

  it('should delegate logout to AuthService', () => {
    const logoutButton = fixture.nativeElement.querySelector(
      '.ui-sidebar__logout',
    ) as HTMLButtonElement;

    logoutButton.click();

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
