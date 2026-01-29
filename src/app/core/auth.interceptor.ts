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
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private auth: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = this.auth.getAccessToken();

    if (token && !this.isAuthRequest(req)) {
      authReq = this.addToken(req, token);
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // OFFLINE / erro de rede (PWA): não manda pro login
        if (error.status === 0) {
          return throwError(() => error);
        }

        if (!this.isAuthRequest(req) && (error.status === 401 || error.status === 403)) {
          const hasRefresh = !!this.auth.getRefreshToken();

          if (error.status === 401 && hasRefresh) {
            return this.handle401(req, next);
          }

          // Sem refresh (ou 403) => expulsa pro login
          this.forceLogoutToLogin();
        }

        return throwError(() => error);
      })
    );
  }

  private handle401(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
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
          this.forceLogoutToLogin();
          return throwError(() => err);
        })
      );
    }

    return this.refreshTokenSubject.pipe(
      filter((token): token is string => token != null),
      take(1),
      switchMap((token) => next.handle(this.addToken(req, token)))
    );
  }

  private forceLogoutToLogin(): void {
    this.auth.logout();

    // Evita loop se já estiver no login
    if (!this.router.url.startsWith('/login')) {
      this.router.navigate(['/login']);
    }
  }

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  private isAuthRequest(req: HttpRequest<any>): boolean {
    return req.url.includes('/auth/login') || req.url.includes('/auth/refresh');
  }
}
