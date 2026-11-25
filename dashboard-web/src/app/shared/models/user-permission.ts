export const USER_PERMISSIONS = [
  'INCIDENTS_READ',
  'INCIDENTS_CREATE',
  'INCIDENTS_UPDATE',
  'INCIDENTS_DELETE',
  'USERS_MANAGE',
  'SETTINGS_MANAGE',
] as const;

export type UserPermission = (typeof USER_PERMISSIONS)[number];

export const DEFAULT_USER_PERMISSIONS: UserPermission[] = [
  'INCIDENTS_READ',
  'INCIDENTS_UPDATE',
];
