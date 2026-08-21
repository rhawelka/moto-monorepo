import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonHeader, Sidebar],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
