import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-settings',
  imports: [TranslocoDirective],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  standalone: true,
})
export class SettingsComponent {
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeLanguage = signal(this.transloco.getActiveLang());

  constructor() {
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((language) => this.activeLanguage.set(language));
  }

  changeLanguage(language: 'en' | 'pl'): void {
    this.transloco.setActiveLang(language);
    localStorage.setItem('language', language);
  }
}
