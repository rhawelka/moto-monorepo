import { Component, EventEmitter, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ui-common-header',
  templateUrl: './common-header.html',
  styleUrl: './common-header.scss',
  imports: [RouterModule, MatButtonModule, MatIconModule, MatMenuModule],
})
export class CommonHeader {
  @Output() logout = new EventEmitter<void>();

  logHeaderAction(action: string): void {
    console.log(`Common header action: ${action}`);
  }
}
