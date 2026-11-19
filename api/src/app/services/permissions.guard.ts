import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserPermission } from '@prisma/client';
import { REQUIRED_PERMISSIONS } from './permissions';

interface AuthenticatedUser {
  role: 'USER' | 'ADMIN';
  permissions: UserPermission[];
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<UserPermission[]>(
        REQUIRED_PERMISSIONS,
        [context.getHandler(), context.getClass()],
      ) ?? [];
    const user = context.switchToHttp().getRequest<{
      user?: AuthenticatedUser;
    }>().user;

    if (user?.role === 'ADMIN') return true;
    if (
      user &&
      requiredPermissions.every((permission) =>
        user.permissions.includes(permission),
      )
    ) {
      return true;
    }

    throw new ForbiddenException('Required permission is missing');
  }
}
