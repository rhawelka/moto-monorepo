import { Component, computed, inject } from '@angular/core';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';
import { RouterModule } from '@angular/router';
import { APP_ROUTES } from '../../app-route-constants';
import { AuthService } from '../../services/auth/auth.service';
import { hasPermission } from '../../services/auth/permission.guard';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonHeader, Sidebar],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {
  readonly navItems = computed(() => {
    const user = this.authService.currentUser();
    return [
      ...(hasPermission(user, 'INCIDENTS_READ')
        ? [
            {
              label: 'overview',
              icon: 'dashboard',
              route: APP_ROUTES.dashboard.overview,
            },
            {
              label: 'incidents',
              icon: 'bar_chart',
              route: APP_ROUTES.dashboard.incidents.list,
            },
          ]
        : []),
      ...(hasPermission(user, 'USERS_MANAGE')
        ? [{ label: 'users', icon: 'group', route: APP_ROUTES.dashboard.users }]
        : []),
      ...(hasPermission(user, 'SETTINGS_MANAGE')
        ? [
            {
              label: 'adminSettings',
              icon: 'settings',
              route: APP_ROUTES.admin.settings,
            },
          ]
        : []),
    ];
  });

  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
