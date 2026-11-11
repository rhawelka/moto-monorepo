import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GoogleAuthCallbackComponent } from './components/login/google-auth-callback.component';
import { authGuard } from './services/auth/auth.guard';
import { guestGuard } from './services/auth/guest.guard';
import { adminGuard } from './services/auth/admin.guard';

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
      edit: (id: string) => `/dashboard/incidents/${id}/edit`,
      editPath: '/dashboard/incidents/:id/edit',
    },
    settings: '/dashboard/settings',
    users: '/dashboard/users',
  },
  legacy: {
    incidents: '/incidents',
    incidentEditPath: '/incidents/:id/edit',
  },
} as const;

export const appRoutes: Routes = [
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
        loadComponent: () =>
          import('./components/overview/overview.component').then(
            (component) => component.OverviewComponent,
          ),
      },
      {
        path: 'incidents/new',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/incidents/incident-create/incident-create.component').then(
            (component) => component.IncidentCreateComponent,
          ),
      },
      {
        path: 'incidents/:id/edit',
        loadComponent: () =>
          import('./components/incidents/incident-edit/incidents-edit.component').then(
            (component) => component.IncidentsEditComponent,
          ),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./components/incidents/incident-list/incidents.component').then(
            (component) => component.IncidentsComponent,
          ),
      },
      {
        path: 'settings',
        component: SettingsComponent,
      },
      {
        path: 'users',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./components/users/users.component').then(
            (component) => component.UsersComponent,
          ),
      },
      { path: 'map', redirectTo: 'overview', pathMatch: 'full' },
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
