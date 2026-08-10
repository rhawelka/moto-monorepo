import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonHeader } from '@moto-monorepo/ui';


@Component({
  imports: [RouterModule, CommonHeader],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'dashboard-web';
}
