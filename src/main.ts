import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { provideNgxMask } from 'ngx-mask';
import { provideHttpClient, withInterceptorsFromDi , HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/core/auth.interceptor'; // criar este arquivo

registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()), // <- isso garante que o interceptor seja usado
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
}).catch(err => console.error(err));
