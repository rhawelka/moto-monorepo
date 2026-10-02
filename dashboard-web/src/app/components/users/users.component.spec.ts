import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { UserRow, UsersService } from '../../services/users/users.service';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  const users: UserRow[] = [
    {
      id: 'user-1',
      username: 'rider',
      email: 'rider@example.com',
      role: 'USER',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  let fixture: ComponentFixture<UsersComponent>;
  let usersService: jest.Mocked<Pick<UsersService, 'listNonAdminUsers'>>;

  beforeEach(async () => {
    usersService = {
      listNonAdminUsers: jest.fn().mockReturnValue(of(users)),
    };

    await TestBed.configureTestingModule({
      imports: [
        UsersComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              users: {
                title: 'Users',
                loadError: 'Users could not be loaded.',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
  });

  it('loads users and requests them from the service once', () => {
    expect(usersService.listNonAdminUsers).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.rowData()).toEqual(users);
    expect(fixture.componentInstance.loadFailed()).toBe(false);
  });

  it('displays a single user when the API returns an object', async () => {
    fixture.destroy();
    usersService.listNonAdminUsers.mockReturnValue(of(users[0]));

    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.rowData()).toEqual(users);
    expect(fixture.componentInstance.loadFailed()).toBe(false);
  });

  it('configures columns for username, email, role, and creation date', () => {
    expect(
      fixture.componentInstance.columnDefs.map(({ field }) => field),
    ).toEqual(['username', 'email', 'role', 'createdAt']);
    expect(fixture.componentInstance.defaultColDef).toMatchObject({
      sortable: true,
      filter: true,
      resizable: true,
    });
  });

  it('displays an alert when loading users fails', async () => {
    fixture.destroy();
    usersService.listNonAdminUsers.mockReturnValue(
      throwError(() => new Error('API unavailable')),
    );

    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.loadFailed()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('Users could not be loaded.');
  });
});
