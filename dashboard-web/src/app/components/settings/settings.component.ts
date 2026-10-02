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
  readonly activeLanguage = signal('');
  readonly activeTheme = signal<'light' | 'dark'>('light');
  private readonly document!: Document;
  private readonly transloco!: TranslocoService;
  private readonly destroyRef!: DestroyRef;

  constructor() {
    this.document = inject(DOCUMENT);
    this.transloco = inject(TranslocoService);
    this.destroyRef = inject(DestroyRef);
    this.activeLanguage.set(this.transloco.getActiveLang());
    this.activeTheme.set(this.getStoredTheme());
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
