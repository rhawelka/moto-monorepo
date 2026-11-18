import { Component, DestroyRef, inject, Input, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
export class Sidebar implements OnChanges {
  @Input() navItems: SidebarItem[] = [
    { label: 'overview', icon: 'dashboard', route: '/dashboard/overview' },
    { label: 'incidents', icon: 'bar_chart', route: '/dashboard/incidents' },
  ];
  @Input() settingsItem: SidebarItem = {
    label: 'settings',
    icon: 'settings',
    route: '/dashboard/settings',
  };
  expanded = true;
  activeItem = 'overview';

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.updateActiveItem();
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateActiveItem());
  }

  ngOnChanges(): void {
    this.updateActiveItem();
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

  private updateActiveItem(): void {
    const currentUrl = this.router.url;

    const match = [...this.navItems, this.settingsItem].find(
      (item) =>
        currentUrl === item.route || currentUrl.startsWith(`${item.route}/`),
    );

    this.activeItem = match?.label ?? this.navItems[0]?.label ?? '';
  }
}
