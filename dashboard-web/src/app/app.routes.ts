import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { SettingsComponent } from './components/settings/settings.component';
import { authGuard } from './services/auth/auth.guard';
import { guestGuard } from './services/auth/guest.guard';
import { adminGuard } from './services/auth/admin.guard';

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
        path: 'incidents/:id/edit',
        loadComponent: () =>
          import('./components/incidents/incidents-edit.component').then(
            (component) => component.IncidentsEditComponent,
          ),
      },
      {
        path: 'incidents',
        loadComponent: () =>
          import('./components/incidents/incidents.component').then(
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
      {
        path: 'map',
        loadComponent: () =>
          import('./components/map/map.component').then(
            (component) => component.MapComponent,
          ),
      },
    ],
  },
  { path: 'incidents/:id/edit', redirectTo: 'dashboard/incidents/:id/edit' },
  { path: 'incidents', redirectTo: 'dashboard/incidents' },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
