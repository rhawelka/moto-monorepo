import { Component, computed, inject } from '@angular/core';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';
import { RouterModule } from '@angular/router';
import { APP_ROUTES } from '../../app.routes';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonHeader, Sidebar],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {
  readonly navItems = computed(() => [
    { label: 'overview', icon: 'dashboard', route: APP_ROUTES.dashboard.overview },
    { label: 'incidents', icon: 'bar_chart', route: APP_ROUTES.dashboard.incidents.list },
    ...(this.authService.currentUser()?.role === 'ADMIN'
      ? [{ label: 'users', icon: 'group', route: APP_ROUTES.dashboard.users }]
      : []),
  ]);

  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
