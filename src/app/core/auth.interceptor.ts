import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    const token = this.auth.getAccessToken();

    const authReq =
      token && !this.isAuthRequest(req) ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // OFFLINE / erro de rede (PWA): não desloga
        if (error.status === 0) {
          return throwError(() => error);
        }

        // Evita mexer com refresh nos próprios endpoints de auth
        if (this.isAuthRequest(req)) {
          return throwError(() => error);
        }

        // 401/403
        if (error.status === 401 || error.status === 403) {
          const hasRefresh = !!this.auth.getRefreshToken();

          // tenta refresh só em 401 e se existir refresh token
          if (error.status === 401 && hasRefresh) {
            return this.handle401(req, next);
          }

          // 403 ou sem refresh token => desloga
          this.auth.logout();
        }

        return throwError(() => error);
      }),
    );
  }

  private handle401(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.auth.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          return next.handle(this.addToken(req, newToken));
        }),
        catchError((err) => {
          this.isRefreshing = false;
          this.auth.logout();
          return throwError(() => err);
        }),
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token != null),
      take(1),
      switchMap((token) => next.handle(this.addToken(req, token))),
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isAuthRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  }
}
