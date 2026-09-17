import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
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
  private readonly document = inject(DOCUMENT);
  private readonly transloco = inject(TranslocoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activeLanguage = signal(this.transloco.getActiveLang());
  readonly activeTheme = signal<'light' | 'dark'>(this.getStoredTheme());

  constructor() {
    this.applyTheme(this.activeTheme());

    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((language) => this.activeLanguage.set(language));
  }

  changeLanguage(language: 'en' | 'pl'): void {
    this.transloco.setActiveLang(language);
    localStorage.setItem('language', language);
  }

  changeTheme(theme: 'light' | 'dark'): void {
    this.activeTheme.set(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private getStoredTheme(): 'light' | 'dark' {
    return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light';
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    this.document.documentElement.dataset['theme'] = theme;
  }
}
