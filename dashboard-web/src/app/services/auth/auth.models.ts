import { UserPermission } from '../../shared/models/user-permission';

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'SUSPENDED';
  permissions?: UserPermission[];
}

export interface AuthResponse {
  user: User;
  access_token: string;
}
