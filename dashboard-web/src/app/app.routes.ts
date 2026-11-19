import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SettingsComponent } from './components/settings/settings.component';
import { AccessDeniedComponent } from './components/access-denied/access-denied.component';
import { GoogleAuthCallbackComponent } from './components/login/google-auth-callback.component';
import { authGuard } from './services/auth/auth.guard';
import { guestGuard } from './services/auth/guest.guard';
import { permissionGuard } from './services/auth/permission.guard';

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

export const appRoutes: Routes = [
  { path: 'access-denied', component: AccessDeniedComponent },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: APP_ROUTES.googleAuthCallbackPath,
    component: GoogleAuthCallbackComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        canActivate: [permissionGuard('INCIDENTS_READ')],
        loadComponent: () =>
          import('./components/overview/overview.component').then(
            (component) => component.OverviewComponent,
          ),
      },
      {
        path: 'incidents/new',
        canActivate: [permissionGuard('INCIDENTS_CREATE')],
        loadComponent: () =>
          import(
            './components/incidents/incident-create/incident-create.component'
          ).then((component) => component.IncidentCreateComponent),
      },
      {
        path: 'incidents/:id/edit',
        canActivate: [permissionGuard('INCIDENTS_UPDATE')],
        loadComponent: () =>
          import(
            './components/incidents/incident-edit/incidents-edit.component'
          ).then((component) => component.IncidentsEditComponent),
      },
      {
        path: 'incidents/:id',
        pathMatch: 'full',
        canActivate: [permissionGuard('INCIDENTS_READ')],
        loadComponent: () =>
          import(
            './components/incidents/incident-detail/incident-detail.component'
          ).then((component) => component.IncidentDetailComponent),
      },
      {
        path: 'incidents',
        canActivate: [permissionGuard('INCIDENTS_READ')],
        loadComponent: () =>
          import(
            './components/incidents/incident-list/incidents.component'
          ).then((component) => component.IncidentsComponent),
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'users',
        canActivate: [permissionGuard('USERS_MANAGE')],
        loadComponent: () =>
          import('./components/users/users.component').then(
            (component) => component.UsersComponent,
          ),
      },
      { path: 'map', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
  {
    path: 'admin/settings',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        canActivate: [permissionGuard('SETTINGS_MANAGE')],
        loadComponent: () =>
          import('./components/admin-settings/admin-settings.component').then(
            (component) => component.AdminSettingsComponent,
          ),
      },
    ],
  },
  {
    path: 'incidents/:id/edit',
    redirectTo: APP_ROUTES.dashboard.incidents.editPath,
  },
  { path: 'incidents', redirectTo: APP_ROUTES.dashboard.incidents.list },
  { path: '', redirectTo: APP_ROUTES.dashboard.root, pathMatch: 'full' },
  { path: '**', redirectTo: APP_ROUTES.dashboard.root },
];
