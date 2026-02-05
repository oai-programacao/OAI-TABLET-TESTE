import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import {
  Observable,
  BehaviorSubject,
  throwError,
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

import { jwtDecode } from 'jwt-decode';
import { environment } from '../../environments/environment';

import { WebSocketService } from './../services/webSocket/websocket.service';
import { LoginSeller } from './../models/login/login-seller.dto';

export interface AuthenticatedUser {
  id: string | null;
  name?: string;
  roles: string[];
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  private webSocketService = inject(WebSocketService);

  private isRefreshingToken = false;
  private refreshTokenSubject = new BehaviorSubject<string | null>(null);

  private refreshSub?: Subscription;
  private tokenExpirationTimer?: ReturnType<typeof setTimeout>;

  private readonly skewMs = 30_000; // 30s de margem em tudo

  public currentUserSubject = new BehaviorSubject<AuthenticatedUser | null>(
    this.getUserFromToken(),
  );

  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Se já tinha sessão (F5), reativa refresh e WS
    const user = this.currentUserSubject.getValue();
    const token = this.getAccessToken();

    if (user && token && !this.isTokenExpired(token)) {
      this.initAutoRefresh(token);
      this.webSocketService.updateTokenAndReconnect(token);
    }
  }

  // ---------------------------
  // LOGIN / LOGOUT
  // ---------------------------
  login(loginSeller: LoginSeller): Observable<any> {
    const headers = new HttpHeaders({ 'X-Client-Type': 'SELLER' });

    return this.http
      .post<any>(`${this.apiUrl}/login`, loginSeller, { headers })
      .pipe(
        tap((response) => {
          this.storeTokens(response.accessToken, response.refreshToken);
          localStorage.setItem('name', response.name ?? '');

          const user = this.buildUserFromAccessToken(response.accessToken);
          this.currentUserSubject.next(user);

          this.initAutoRefresh(response.accessToken);

          // ✅ WS com token novo (canal pelo sub)
          this.webSocketService.updateTokenAndReconnect(response.accessToken);

          this.router.navigate(['/search']);
        }),
      );
  }

  logout(): void {
    this.clearRefreshTimer();
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('name');

    this.currentUserSubject.next(null);
    this.webSocketService.disconnect();
    console.trace('🚨 logout chamado');
    this.router.navigate(['/login']);
  }
  // ---------------------------
  // TOKENS
  // ---------------------------
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

    if (this.isTokenExpired(token)) return null;

    return this.buildUserFromAccessToken(token);
  }

  private buildUserFromAccessToken(token: string): AuthenticatedUser | null {
    try {
      const decoded: any = jwtDecode(token);
      return {
        id: decoded?.id ?? null,
        name: decoded?.name,
        roles: decoded?.roles ?? [],
        email: decoded?.sub ?? decoded?.email,
      };
    } catch {
      return null;
    }
  }

  // ---------------------------
  // REFRESH (com proteção de corrida)
  // ---------------------------
  refreshToken(): Observable<string> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      // sem refresh: sessão acabou
      this.logout();
      return throwError(() => new Error('Nenhum refresh token disponível'));
    }

    // Se já tem refresh em andamento, aguarda o novo token
    if (this.isRefreshingToken) {
      return this.refreshTokenSubject.pipe(
        filter((t): t is string => t !== null),
        take(1),
      );
    }

    this.isRefreshingToken = true;
    this.refreshTokenSubject.next(null);

    return this.http
      .post<any>(
        `${this.apiUrl}/refresh`,
        { refreshToken },
        { headers: new HttpHeaders({ 'X-Client-Type': 'SELLER' }) },
      )
      .pipe(
        tap((response) => {
          // ✅ MUITO IMPORTANTE: salvar os DOIS, pq refresh é rotacionado
          this.storeTokens(response.accessToken, response.refreshToken);

          const user = this.buildUserFromAccessToken(response.accessToken);
          this.currentUserSubject.next(user);

          this.refreshTokenSubject.next(response.accessToken);

          // ✅ WS com token novo (canal pelo sub)
          this.webSocketService.updateTokenAndReconnect(response.accessToken);

          // ✅ reprograma auto refresh com o token novo
          this.initAutoRefresh(response.accessToken);
        }),
        switchMap((response) => of(response.accessToken)),
        catchError((err) => {
          // aqui você pode escolher não deslogar em erro de rede
          // mas se for 401/403 normalmente é sessão inválida mesmo
          this.logout();
          return throwError(() => err);
        }),
        finalize(() => {
          this.isRefreshingToken = false;
        }),
        shareReplay(1),
      );
  }

  // ---------------------------
  // AUTO REFRESH
  // ---------------------------
  initAutoRefresh(token?: string): void {
    this.clearRefreshTimer();

    const access = token ?? this.getAccessToken();
    if (!access) return;

    let expMs: number;
    try {
      const decoded: any = jwtDecode(access);
      expMs = (decoded?.exp ?? 0) * 1000;
    } catch {
      this.logout();
      return;
    }

    if (!expMs) {
      this.logout();
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = expMs - now - this.skewMs;

    // já está “quase expirado”: tenta refresh rápido
    if (timeUntilExpiry <= 0) {
      this.refreshSub = timer(1000)
        .pipe(switchMap(() => this.refreshToken()))
        .subscribe({ error: () => {} });
      return;
    }

    // dispara 1 min antes, no mínimo 5s
    const refreshIn = Math.max(timeUntilExpiry - 60_000, 5_000);

    this.tokenExpirationTimer = setTimeout(() => {
      this.refreshToken().subscribe({ error: () => {} });
    }, refreshIn);
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

  // ---------------------------
  // HELPERS
  // ---------------------------
  isAuthenticated(): boolean {
    const access = this.getAccessToken();
    const refresh = this.getRefreshToken();
    if (!access || !refresh) return false;
    // mesmo se access expirou, ainda consideramos “sessão recuperável”
    return true;
  }

  getUserRoles(): string[] {
    return this.getUserFromToken()?.roles ?? [];
  }

  getSellerId(): string | null {
    return this.getUserFromToken()?.id ?? null;
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const expMs = (decoded?.exp ?? 0) * 1000;
      return !expMs || expMs <= Date.now() + this.skewMs;
    } catch {
      return true;
    }
  }
}
