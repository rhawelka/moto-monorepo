import { Component, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  themeQuartz,
} from 'ag-grid-community';
import { AgGridAngular } from 'ag-grid-angular';
import { TranslocoDirective } from '@jsverse/transloco';
import { UserRow, UsersService } from '../../services/users/users.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-users',
  imports: [AgGridAngular, TranslocoDirective],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
  standalone: true,
})
export class UsersComponent {
  readonly theme = themeQuartz;
  readonly rowData = signal<UserRow[]>([]);
  readonly loadFailed = signal(false);
  readonly defaultColDef: ColDef = {
    flex: 1,
    minWidth: 160,
    sortable: true,
    filter: true,
    resizable: true,
  };
  readonly columnDefs: ColDef<UserRow>[] = [
    { field: 'username', headerName: 'Username', minWidth: 180 },
    { field: 'email', headerName: 'Email', minWidth: 240 },
    { field: 'role', headerName: 'Role', maxWidth: 140 },
    {
      field: 'createdAt',
      headerName: 'Created',
      valueFormatter: ({ value }) => new Date(value).toLocaleString(),
      minWidth: 220,
    },
  ];

  constructor(usersService: UsersService) {
    usersService
      .listNonAdminUsers()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (users) => this.rowData.set(users),
        error: () => this.loadFailed.set(true),
      });
  }
}
