import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ui-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  @Output() logoutRequested = new EventEmitter<void>();
  expanded = true;

  toggle(): void {
    this.expanded = !this.expanded;
  }

  logout(): void {
    this.logoutRequested.emit();
  }
}
