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
    // NÃO mexe em endpoints de auth
    if (this.isAuthRequest(req)) {
      return next.handle(req);
    }

    // adiciona Bearer se existir access token
    const token = this.auth.getAccessToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // erro de rede / offline (PWA): não faz logout
        if (error.status === 0) {
          return throwError(() => error);
        }

        // 401: tenta refresh se tiver refreshToken
        if (error.status === 401 && this.auth.getRefreshToken()) {
          return this.handle401(authReq, next);
        }

        // 403 ou 401 sem refresh token -> logout
        if (error.status === 401 || error.status === 403) {
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

    // se já está refreshando, espera o token novo e tenta de novo
    return this.refreshTokenSubject.pipe(
      filter((t): t is string => t !== null),
      take(1),
      switchMap((token) => next.handle(this.addToken(req, token))),
    );
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  private isAuthRequest(req: HttpRequest<any>): boolean {
    // ajuste se seu path real for /api/auth/...
    return req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  }
}
