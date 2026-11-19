import { Component } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [TranslocoDirective],
  template: `
    <main class="access-denied" *transloco="let t; prefix: 'accessDenied'">
      <h1>{{ t('title') }}</h1>
      <p>{{ t('message') }}</p>
    </main>
  `,
  styles: `
    .access-denied {
      padding: 2rem;
    }

    h1 {
      margin: 0 0 0.5rem;
    }
  `,
})
export class AccessDeniedComponent {}
