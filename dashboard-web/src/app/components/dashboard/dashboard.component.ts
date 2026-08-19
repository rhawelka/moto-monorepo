import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonHeader, Sidebar } from '@moto-monorepo/ui';

@Component({
  selector: 'app-dashboard',
  imports: [RouterModule, CommonHeader, Sidebar],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  standalone: true,
})
export class DashboardComponent {}
