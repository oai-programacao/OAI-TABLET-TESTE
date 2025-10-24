import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { DevToolsLogger } from './devtools-logger';

@Injectable()
export class HttpLoggerInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const started = performance.now();

    DevToolsLogger.addCustomLog([
      `HTTP → ${req.method} ${req.urlWithParams}`,
      req.body ? `Payload: ${JSON.stringify(req.body)}` : 'Sem body',
    ]);

    return next.handle(req).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const elapsed = performance.now() - started;
            DevToolsLogger.addCustomLog([
              `✅ RESPONSE ${req.method} ${req.urlWithParams}`,
              `Status: ${event.status} (${event.statusText})`,
              `Tempo: ${elapsed.toFixed(1)}ms`,
              `Response: ${JSON.stringify(event.body)}`,
            ]);
          }
        },
        error: (error: HttpErrorResponse) => {
          const elapsed = performance.now() - started;
          DevToolsLogger.addCustomLog([
            `❌ ERROR ${req.method} ${req.urlWithParams}`,
            `Status: ${error.status}`,
            `Tempo: ${elapsed.toFixed(1)}ms`,
            `Message: ${error.message}`,
            `Error: ${JSON.stringify(error.error)}`,
          ]);
        },
      })
    );
  }
}
