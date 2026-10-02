import { Component, computed, inject } from '@angular/core';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';
import { RouterModule } from '@angular/router';
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
    { label: 'overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'reports', icon: 'bar_chart', route: '/dashboard' },
    { label: 'map', icon: 'map', route: '/dashboard/map' },
    ...(this.authService.currentUser()?.role === 'ADMIN'
      ? [{ label: 'users', icon: 'group', route: '/dashboard/users' }]
      : []),
  ]);

  private readonly authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
