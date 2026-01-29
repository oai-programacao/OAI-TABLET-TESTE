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
  distinctUntilChanged,
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
  private accessTokenSubject = new BehaviorSubject<string | null>(
    this.getAccessToken(),
  );
  public accessToken$ = this.accessTokenSubject.asObservable();

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
    if (user) this.initAutoRefresh();

    // sempre que trocar token, reinicia WS
    this.accessToken$
      .pipe(
        filter((t): t is string => !!t),
        distinctUntilChanged(),
      )
      .subscribe((token) => {
        this.webSocketService.connectOrUpdateToken(token);
      });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;

      const token = this.getAccessToken();
      const hasRefresh = !!this.getRefreshToken();

      if (
        token &&
        this.isTokenExpired(token) &&
        hasRefresh &&
        !this.isRefreshingToken
      ) {
        this.refreshToken().subscribe({
          next: () => this.initAutoRefresh(), // ✅ reprograma timer pós-volta do iOS
        });
      }
    });
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
    this.accessTokenSubject.next(null);
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

    this.accessTokenSubject.next(accessToken);
  }

  getUserFromToken(): AuthenticatedUser | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);

      const expMs = (decoded.exp ?? 0) * 1000;
      if (!expMs || expMs <= Date.now() + 30_000) return null;

      return {
        id: decoded.id || null,
        name: decoded.name,
        roles: decoded.roles || [],
        email: decoded.sub ?? decoded.email,
      };
    } catch (error) {
      this.clearTokens();
      return null;
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.accessTokenSubject.next(null);
    this.currentUserSubject.next(null);
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
          this.currentUserSubject.next(this.getUserFromToken());
          this.refreshTokenSubject.next(response.accessToken);
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
    } catch {
      this.logout();
      return;
    }

    const now = Date.now();
    const skewMs = 30_000; // 🔥 MESMO skew do resto do sistema
    const timeUntilExpiry = exp - now - skewMs;

    // 🔁 Já expirado (ou quase): refresh imediato
    if (timeUntilExpiry <= 0) {
      this.refreshSub = timer(1000)
        .pipe(switchMap(() => this.refreshToken()))
        .subscribe({
          next: () => this.initAutoRefresh(), // 🔁 reprograma
        });
      return;
    }

    // ⏰ Programa refresh antes de vencer
    const refreshTime = Math.max(timeUntilExpiry - 60_000, 5_000);

    this.tokenExpirationTimer = setTimeout(() => {
      this.refreshToken().subscribe({
        next: () => this.initAutoRefresh(), // 🔁 reprograma
      });
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
    const token = this.getAccessToken();
    return !!token && !this.isTokenExpired(token);
  }

  getUserRoles(): string[] {
    const user = this.getUserFromToken();
    return user?.roles || [];
  }

  getSellerId(): string | null {
    const user = this.getUserFromToken();
    return user?.id || null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const expMs = (decoded?.exp ?? 0) * 1000;
      const skewMs = 30_000; // 30s de margem
      return !expMs || expMs <= Date.now() + skewMs;
    } catch {
      return true;
    }
  }
}
