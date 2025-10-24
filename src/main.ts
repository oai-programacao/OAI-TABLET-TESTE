import './polyfills';

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { provideNgxMask } from 'ngx-mask';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './app/core/auth.interceptor';
import { HttpLoggerInterceptor } from './app/shared/components/devtools-logger/http-logger-interceptor';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './app/services/webSocket/wsStompConfig';
import { DevToolsLogger } from './app/shared/components/devtools-logger/devtools-logger';

registerLocaleData(localePt);

// ✅ Inicia o painel DevTools Logger (fica no canto inferior direito)
DevToolsLogger.init();

bootstrapApplication(AppComponent, {
  ...appConfig,
  providers: [
    ...(appConfig.providers || []),

    provideNgxMask(),

    // ✅ Usa interceptors baseados em classe (AuthInterceptor + HttpLoggerInterceptor)
    provideHttpClient(withInterceptorsFromDi()),

    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpLoggerInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },

    // ✅ Serviço de WebSocket
    {
      provide: RxStompService,
      useFactory: () => {
        const service = new RxStompService();
        service.configure(wsStompConfig);
        return service;
      },
    },
  ],
}).catch((err) => console.error(err));
