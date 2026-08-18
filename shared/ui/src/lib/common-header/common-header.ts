import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'ui-common-header',
  templateUrl: './common-header.html',
  styleUrl: './common-header.scss',
  imports: [RouterModule],
})
export class CommonHeader {}
