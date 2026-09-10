import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonHeader } from '@moto-monorepo/ui';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterModule,
    CommonHeader,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {
  private authService = inject(AuthService);
  sidenavCollapsed = false;

  toggleSidenav(): void {
    this.sidenavCollapsed = !this.sidenavCollapsed;
  }

  logout(): void {
    this.authService.logout();
  }
}
