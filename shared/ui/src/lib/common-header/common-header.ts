import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ui-common-header',
  templateUrl: './common-header.html',
  styleUrl: './common-header.scss',
  imports: [RouterModule, MatButtonModule, MatIconModule],
})
export class CommonHeader {
  logHeaderAction(action: string): void {
    console.log(`Common header action: ${action}`);
  }
}
