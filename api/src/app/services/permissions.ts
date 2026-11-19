import { SetMetadata } from '@nestjs/common';
import { UserPermission } from '@prisma/client';

export const REQUIRED_PERMISSIONS = 'required-permissions';

export const RequirePermissions = (...permissions: UserPermission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);
