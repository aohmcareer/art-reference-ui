import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { 
  provideHttpClient, 
  withInterceptors,
  withFetch
} from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

import { routes } from './app.routes';
import { ErrorInterceptor } from './core/http/error.interceptor';
import { LoadingInterceptor } from './core/http/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([
        ErrorInterceptor,
        LoadingInterceptor
      ]),
      withFetch()
    ),
    importProvidersFrom(FormsModule, MatButtonModule, MatToolbarModule, MatIconModule),
    provideAnimations()
  ]
};