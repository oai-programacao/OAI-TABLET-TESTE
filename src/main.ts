import './polyfills';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { provideNgxMask } from 'ngx-mask';
import { provideHttpClient, withInterceptorsFromDi , HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './app/core/auth.interceptor';

import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './app/services/webSocket/wsStompConfig';

registerLocaleData(localePt);

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),
    provideNgxMask(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: RxStompService,
      useFactory: () => {
        const service = new RxStompService();
        service.configure(wsStompConfig);
        return service;
      }
    }
  ]
}).catch(err => console.error(err));
