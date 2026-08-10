import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';

@Component({
  imports: [RouterModule, CommonHeader, Sidebar],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'dashboard-web';
}
