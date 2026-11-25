import { Role, UserPermission, UserStatus } from '@prisma/client';

export interface User {
  id: string;
  username: string | null;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  permissions: UserPermission[];
}
