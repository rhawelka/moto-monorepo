import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideTransloco } from '@jsverse/transloco';
import { authInterceptor } from './services/auth/auth.interceptor';
import { appRoutes } from './app.routes';
import { TranslocoHttpLoader } from './transloco-http-loader';

const availableLanguages = ['en', 'pl'];
const languageStorageKey = 'language';
const storedLanguage = localStorage.getItem(languageStorageKey);
const defaultLanguage =
  storedLanguage !== null && availableLanguages.includes(storedLanguage)
    ? storedLanguage
    : 'en';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(appRoutes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...provideTransloco({
      config: {
        availableLangs: availableLanguages,
        defaultLang: defaultLanguage,
        fallbackLang: 'en',
        reRenderOnLangChange: true,
        prodMode: false,
      },
      loader: TranslocoHttpLoader,
    }),
  ],
};
