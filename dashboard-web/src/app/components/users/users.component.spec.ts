import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { UserRow, UsersService } from '../../services/users/users.service';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  const users: UserRow[] = [
    {
      id: 'user-1',
      username: 'rider',
      email: 'rider@example.com',
      role: 'USER',
      status: 'ACTIVE',
      permissions: ['INCIDENTS_READ', 'INCIDENTS_UPDATE'],
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];
  let fixture: ComponentFixture<UsersComponent>;
  let usersService: jest.Mocked<
    Pick<UsersService, 'list' | 'create' | 'update' | 'delete'>
  >;

  beforeEach(async () => {
    usersService = {
      list: jest.fn().mockReturnValue(of(users)),
      create: jest.fn().mockReturnValue(of(users[0])),
      update: jest.fn().mockReturnValue(of(users[0])),
      delete: jest.fn().mockReturnValue(of(void 0)),
    };

    await TestBed.configureTestingModule({
      imports: [
        UsersComponent,
        TranslocoTestingModule.forRoot({
          langs: {
            en: {
              users: {
                title: 'Users',
                subtitle: 'Manage users',
                createUser: 'Create user',
                loadError: 'Users could not be loaded.',
                username: 'Username',
                email: 'Email',
                role: 'Role',
                status: 'Status',
                permissions: 'Permissions',
                createdAt: 'Created',
                actions: 'Actions',
                role_USER: 'User',
                status_ACTIVE: 'Active',
                permission_INCIDENTS_READ: 'View incidents',
                permission_INCIDENTS_UPDATE: 'Edit incidents',
                allPermissions: 'All permissions',
                noPermissions: 'None',
                noUsername: 'No username',
                currentUser: 'Current account',
                edit: 'Edit',
                delete: 'Delete',
                empty: 'No users found.',
                loading: 'Loading users…',
              },
            },
          },
          translocoConfig: {
            availableLangs: ['en'],
            defaultLang: 'en',
          },
        }),
      ],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: AuthService,
          useValue: {
            currentUser: signal({
              id: 'admin-1',
              email: 'admin@example.com',
              role: 'ADMIN',
              permissions: [],
            }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    fixture.detectChanges();
  });

  it('loads the complete user list', () => {
    expect(usersService.list).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.rowData()).toEqual(users);
    expect(fixture.componentInstance.loadFailed()).toBe(false);
  });

  it('creates a user with the selected role, status, and permissions', () => {
    const component = fixture.componentInstance;
    component.openCreateForm();
    component.form.setValue({
      username: 'new-rider',
      email: 'new@example.com',
      password: 'password123',
      role: 'USER',
      status: 'SUSPENDED',
      permissions: ['INCIDENTS_READ'],
    });

    component.save();

    expect(usersService.create).toHaveBeenCalledWith({
      username: 'new-rider',
      email: 'new@example.com',
      password: 'password123',
      role: 'USER',
      status: 'SUSPENDED',
      permissions: ['INCIDENTS_READ'],
    });
    expect(component.formOpen()).toBe(false);
  });

  it('updates a user and omits an unchanged password', () => {
    const component = fixture.componentInstance;
    component.openEditForm(users[0]);
    component.form.controls.status.setValue('SUSPENDED');

    component.save();

    expect(usersService.update).toHaveBeenCalledWith('user-1', {
      username: 'rider',
      email: 'rider@example.com',
      role: 'USER',
      status: 'SUSPENDED',
      permissions: ['INCIDENTS_READ', 'INCIDENTS_UPDATE'],
    });
  });

  it('requires explicit confirmation before deleting a user', () => {
    const component = fixture.componentInstance;
    component.confirmDelete(users[0]);
    expect(usersService.delete).not.toHaveBeenCalled();

    component.requestDelete(users[0]);
    component.confirmDelete(users[0]);

    expect(usersService.delete).toHaveBeenCalledWith('user-1');
  });

  it('displays an alert when loading users fails', async () => {
    fixture.destroy();
    usersService.list.mockReturnValue(
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
