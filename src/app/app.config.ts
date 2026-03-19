import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { MaterialRacingLedPreset } from '../assets/themes/material-racing-led.preset';
import { authTokenInterceptor } from './core/interceptors/auth-token.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authTokenInterceptor])),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: MaterialRacingLedPreset,
        options: {
          darkModeSelector: '.app-dark',
        },
      },
    }),
  ],
};
