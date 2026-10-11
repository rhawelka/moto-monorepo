import { Component, inject, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { TranslocoDirective } from '@jsverse/transloco';
import { Router, RouterModule } from '@angular/router';

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
    { label: 'overview', icon: 'dashboard', route: '/dashboard/overview' },
    { label: 'incidents', icon: 'bar_chart', route: '/dashboard/incidents' },
    { label: 'map', icon: 'map', route: '/dashboard/map' },
  ];
  @Input() settingsItem: SidebarItem = {
    label: 'settings',
    icon: 'settings',
    route: '/dashboard/settings',
  };
  expanded = true;
  activeItem = 'overview';

  private readonly router = inject(Router);

  constructor() {
    this.activeItem = this.getActiveItem();
    this.router.events.subscribe(() => {
      this.activeItem = this.getActiveItem();
    });
  }

  isItemActive(item: SidebarItem): boolean {
    return this.activeItem === item.label;
  }

  selectItem(item: SidebarItem): void {
    this.activeItem = item.label;
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  private getActiveItem(): string {
    const currentUrl = this.router.url;

    const match = [...this.navItems, this.settingsItem].find(
      (item) =>
        currentUrl === item.route || currentUrl.startsWith(`${item.route}/`),
    );

    return match?.label ?? this.navItems[0]?.label ?? '';
  }
}
