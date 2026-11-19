export const APP_ROUTES = {
  login: '/login',
  register: '/register',
  googleAuthCallbackPath: 'auth/callback',
  dashboard: {
    root: '/dashboard',
    overview: '/dashboard/overview',
    incidents: {
      list: '/dashboard/incidents',
      create: '/dashboard/incidents/new',
      detail: (id: string) => `/dashboard/incidents/${id}`,
      detailPath: '/dashboard/incidents/:id',
      edit: (id: string) => `/dashboard/incidents/${id}/edit`,
      editPath: '/dashboard/incidents/:id/edit',
    },
    settings: '/dashboard/settings',
    users: '/dashboard/users',
  },
  admin: {
    settings: '/admin/settings',
  },
  legacy: {
    incidents: '/incidents',
    incidentEditPath: '/incidents/:id/edit',
  },
} as const;
