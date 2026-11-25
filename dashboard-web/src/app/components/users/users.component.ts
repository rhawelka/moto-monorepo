import { DatePipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import {
  DEFAULT_USER_PERMISSIONS,
  USER_PERMISSIONS,
  UserPermission,
} from '../../shared/models/user-permission';
import { AuthService } from '../../services/auth/auth.service';
import {
  ManagedUserUpdate,
  ManagedUserInput,
  UserRow,
  UsersService,
} from '../../services/users/users.service';

const RESTRICTED_PERMISSIONS: UserPermission[] = [
  'USERS_MANAGE',
  'SETTINGS_MANAGE',
];

@Component({
  selector: 'app-users',
  imports: [DatePipe, ReactiveFormsModule, TranslocoDirective],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  standalone: true,
})
export class UsersComponent {
  readonly rowData = signal<UserRow[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saveFailed = signal(false);
  readonly deleteFailed = signal(false);
  readonly saving = signal(false);
  readonly formOpen = signal(false);
  readonly editingId = signal<string | null>(null);
  readonly confirmingDeleteId = signal<string | null>(null);
  readonly permissions = USER_PERMISSIONS;
  readonly currentUserId = computed(
    () => this.authService.currentUser()?.id ?? '',
  );
  readonly isAdmin = computed(
    () => this.authService.currentUser()?.role === 'ADMIN',
  );
  readonly form = new FormGroup({
    username: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(80)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.email,
        Validators.maxLength(254),
      ],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(8)],
    }),
    role: new FormControl<'USER' | 'ADMIN'>('USER', { nonNullable: true }),
    status: new FormControl<'ACTIVE' | 'SUSPENDED'>('ACTIVE', {
      nonNullable: true,
    }),
    permissions: new FormControl<UserPermission[]>(
      [...DEFAULT_USER_PERMISSIONS],
      { nonNullable: true },
    ),
  });

  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.load();
  }

  openCreateForm(): void {
    this.editingId.set(null);
    this.saveFailed.set(false);
    this.form.reset({
      username: '',
      email: '',
      password: '',
      role: 'USER',
      status: 'ACTIVE',
      permissions: [...DEFAULT_USER_PERMISSIONS],
    });
    this.form.controls.username.setValidators([
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(80),
    ]);
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
    ]);
    this.form.updateValueAndValidity();
    this.formOpen.set(true);
  }

  openEditForm(user: UserRow): void {
    if (!this.canManage(user)) return;

    this.editingId.set(user.id);
    this.saveFailed.set(false);
    this.form.reset({
      username: user.username ?? '',
      email: user.email,
      password: '',
      role: user.role,
      status: user.status,
      permissions: [...user.permissions],
    });
    this.form.controls.username.setValidators([
      Validators.maxLength(80),
      ...(user.username === null
        ? []
        : [Validators.required, Validators.pattern(/\S/)]),
    ]);
    this.form.controls.password.setValidators([Validators.minLength(8)]);
    this.form.updateValueAndValidity();
    this.formOpen.set(true);
  }

  closeForm(): void {
    if (this.saving()) return;
    this.formOpen.set(false);
    this.editingId.set(null);
    this.saveFailed.set(false);
  }

  togglePermission(permission: UserPermission, event: Event): void {
    if (!this.isAdmin() && RESTRICTED_PERMISSIONS.includes(permission)) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    const permissions = this.form.controls.permissions.value;
    this.form.controls.permissions.setValue(
      target.checked
        ? [...new Set([...permissions, permission])]
        : permissions.filter((item) => item !== permission),
    );
    this.form.controls.permissions.markAsDirty();
  }

  hasPermission(permission: UserPermission): boolean {
    return this.form.controls.permissions.value.includes(permission);
  }

  canManage(user: UserRow): boolean {
    return (
      user.id !== this.currentUserId() &&
      (this.isAdmin() || user.role !== 'ADMIN')
    );
  }

  save(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.saveFailed.set(false);
    const value = this.form.getRawValue();
    const id = this.editingId();
    const request = id
      ? this.usersService.update(id, {
          username: value.username.trim() || null,
          email: value.email.trim(),
          role: value.role,
          status: value.status,
          permissions: value.permissions,
          ...(value.password ? { password: value.password } : {}),
        } satisfies ManagedUserUpdate)
      : this.usersService.create({
          username: value.username.trim(),
          email: value.email.trim(),
          role: value.role,
          status: value.status,
          permissions: value.permissions,
          password: value.password,
        } satisfies ManagedUserInput & { password: string });

    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.editingId.set(null);
        this.load();
      },
      error: () => {
        this.saving.set(false);
        this.saveFailed.set(true);
      },
    });
  }

  requestDelete(user: UserRow): void {
    if (!this.canManage(user)) return;
    this.confirmingDeleteId.set(user.id);
    this.deleteFailed.set(false);
  }

  cancelDelete(): void {
    this.confirmingDeleteId.set(null);
    this.deleteFailed.set(false);
  }

  confirmDelete(user: UserRow): void {
    if (!this.canManage(user) || this.confirmingDeleteId() !== user.id) return;

    this.usersService
      .delete(user.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.confirmingDeleteId.set(null);
          this.load();
        },
        error: () => this.deleteFailed.set(true),
      });
  }

  private load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.usersService
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (users) => {
          this.rowData.set(users);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadFailed.set(true);
        },
      });
  }
}
