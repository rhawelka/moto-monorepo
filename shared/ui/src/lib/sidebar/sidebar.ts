import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoDirective } from '@jsverse/transloco';
import { RouterModule } from '@angular/router';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'ui-sidebar',
  imports: [
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatSidenavModule,
    MatToolbarModule,
    TranslocoDirective,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Input() navItems: SidebarItem[] = [
    { label: 'overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'reports', icon: 'bar_chart', route: '/dashboard' },
  ];
  @Input() settingsItem: SidebarItem = {
    label: 'settings',
    icon: 'settings',
    route: '/dashboard/settings',
  };
  expanded = true;

  toggle(): void {
    this.expanded = !this.expanded;
  }
}
