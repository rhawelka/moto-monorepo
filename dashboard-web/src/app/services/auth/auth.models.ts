export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  access_token: string;
}
