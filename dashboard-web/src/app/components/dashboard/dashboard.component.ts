import { Component } from '@angular/core';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonHeader, Sidebar],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {}
