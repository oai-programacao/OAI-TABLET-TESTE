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

    {
      provide: RxStompService,
      useFactory: () => {
        const service = new RxStompService();
        service.configure(wsStompConfig);
        return service;
      },
    },
  ],
})
.then(() => {
  // ✅ Bloqueia emojis globalmente em todos inputs/textarea/p-inputText/p-textarea
  document.addEventListener('input', (event: Event) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target) return;

    const emojiRegex = /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD83C-\uDBFF\uDC00-\uDFFF])/g;

    // Remove emojis
    target.value = target.value.replace(emojiRegex, '');

    // Dispara evento input para atualizar FormControl/ngModel
    target.dispatchEvent(new Event('input'));
  });
})
.catch((err) => console.error(err));
