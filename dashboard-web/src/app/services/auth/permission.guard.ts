import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserPermission } from '../../shared/models/user-permission';
import { AuthService } from './auth.service';

export function hasPermission(
  user: ReturnType<AuthService['currentUser']>,
  permission: UserPermission,
): boolean {
  return user?.role === 'ADMIN' || !!user?.permissions?.includes(permission);
}

export const permissionGuard = (permission: UserPermission): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return hasPermission(authService.currentUser(), permission)
      ? true
      : router.createUrlTree(['/access-denied']);
  };
};
