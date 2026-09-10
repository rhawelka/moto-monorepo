import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
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
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Output() logoutRequested = new EventEmitter<void>();
  @Input() navItems: SidebarItem[] = [
    { label: 'Overview', icon: 'dashboard', route: '/dashboard' },
    { label: 'Reports', icon: 'bar_chart', route: '/dashboard' },
    { label: 'Settings', icon: 'settings', route: '/dashboard' },
  ];
  expanded = true;

  toggle(): void {
    this.expanded = !this.expanded;
  }

  logout(): void {
    this.logoutRequested.emit();
  }
}
