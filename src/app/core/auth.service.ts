import { WebSocketService } from './../services/webSocket/websocket.service';

import { LoginSeller } from './../models/login/login-seller.dto';
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Observable,
  throwError,
  BehaviorSubject,
  timer,
  Subscription,
  of,
} from 'rxjs';
import {
  tap,
  catchError,
  switchMap,
  filter,
  take,
  finalize,
  shareReplay,
} from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';

export interface AuthenticatedUser {
  id: string | null;
  name?: string;
  roles: string[];
  email?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private isRefreshingToken = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);
  private refreshSub?: Subscription;
  private tokenExpirationTimer?: any;
  private webSocketService = inject(WebSocketService);

  //Reativo
  public currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(
    this.getUserFromToken(),
  );

  public currentUser$ = this.currentUserSubject.asObservable();
  public isLoggedIn$ = this.currentUser$.pipe(switchMap((user) => of(!!user)));

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const user = this.currentUserSubject.getValue();

    if (user) {
      this.initAutoRefresh();

      const token = this.getAccessToken();
      if (token) {
        this.webSocketService.updateTokenAndReconnect(token);
      }
    } else {
      this.webSocketService.disconnect();
    }
  }

  /** ===========================
   * LOGIN
   ============================ */

  login(loginSeller: LoginSeller): Observable<any> {
    const headers = new HttpHeaders({
      'X-Client-Type': 'SELLER',
    });

    return this.http
      .post<any>(`${this.apiUrl}/login`, loginSeller, { headers })
      .pipe(
        tap((response) => {
          this.storeTokens(response.accessToken, response.refreshToken);
          localStorage.setItem('name', response.name);
          this.currentUserSubject.next(this.getUserFromToken());
          this.initAutoRefresh();

          // ✅ inicia WS com token recém logado
          this.webSocketService.updateTokenAndReconnect(response.accessToken);

          this.router.navigate(['/search']);
        }),
      );
  }

  /** ===========================
   * LOGOUT
   ============================ */
  logout(): void {
    this.clearRefreshTimer();
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = undefined;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('name');
    this.currentUserSubject.next(null);
    this.webSocketService.disconnect();
    this.router.navigate(['/login']);
  }

  /** ===========================
   * TOKEN HELPERS
   ============================ */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  getUserFromToken(): AuthenticatedUser | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);

      if (!decoded?.exp) return null;

      if (decoded.exp * 1000 < Date.now()) {
        return null;
      }

      return {
        id: decoded.id || null,
        name: decoded.name,
        roles: decoded.roles || [],
        email: decoded.sub ?? decoded.email,
      };
    } catch {
      return null;
    }
  }

  /** ===========================
   * REFRESH TOKEN (race condition protegido)
   ============================ */
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Nenhum refresh token disponível'));
    }

    if (this.isRefreshingToken) {
      return this.refreshTokenSubject.pipe(
        filter((token) => token !== null),
        take(1),
      ) as Observable<string>;
    }

    this.isRefreshingToken = true;
    this.refreshTokenSubject.next(null);

    return this.http
      .post<any>(
        `${this.apiUrl}/refresh`,
        { refreshToken },
        {
          headers: new HttpHeaders({
            'X-Client-Type': 'SELLER',
          }),
        },
      )
      .pipe(
        tap((response) => {
          this.storeTokens(response.accessToken, response.refreshToken);
          this.currentUserSubject.next(
            this.buildUserFromAccessToken(response.accessToken),
          );
          this.refreshTokenSubject.next(response.accessToken);
          this.webSocketService.updateTokenAndReconnect(response.accessToken);
        }),
        switchMap((response) => of(response.accessToken)),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshingToken = false;
        }),
        shareReplay(1),
      );
  }

  /** ===========================
   * AUTO REFRESH PROATIVO
   ============================ */
  initAutoRefresh(): void {
    this.clearRefreshTimer();

    const token = this.getAccessToken();
    if (!token) return;

    let exp: number;
    try {
      const decoded: any = jwtDecode(token);
      exp = decoded.exp * 1000;
    } catch (e) {
      this.logout();
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = exp - now;

    if (timeUntilExpiry <= 0) {
      this.refreshSub = timer(1000)
        .pipe(switchMap(() => this.refreshToken()))
        .subscribe();
      return;
    }

    const refreshTime = Math.max(timeUntilExpiry - 60_000, 5_000);

    this.tokenExpirationTimer = setTimeout(() => {
      this.refreshToken().subscribe();
    }, refreshTime);
  }

  clearRefreshTimer(): void {
    if (this.refreshSub) {
      this.refreshSub.unsubscribe();
      this.refreshSub = undefined;
    }
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = undefined;
    }
  }

  /** ===========================
   * AUXILIARES
   ============================ */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  getUserRoles(): string[] {
    const user = this.getUserFromToken();
    return user?.roles || [];
  }

  getSellerId(): string | null {
    const user = this.getUserFromToken();
    return user?.id || null;
  }

  private buildUserFromAccessToken(token: string): AuthenticatedUser | null {
    try {
      const decoded: any = jwtDecode(token);
      return {
        id: decoded.id || null,
        name: decoded.name,
        roles: decoded.roles || [],
        email: decoded.sub ?? decoded.email,
      };
    } catch {
      return null;
    }
  }
}
