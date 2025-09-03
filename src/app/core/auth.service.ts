import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/login';
  private refreshUrl = 'http://localhost:8080/login/refresh';

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post<any>(this.apiUrl, { username, password }).pipe(
      tap((response) => {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('nome', response.name);
        this.router.navigate(['/kanban']);
      })
    );
  }

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Refresh token ausente'));
    }

    return this.http.post<any>(this.refreshUrl, { refreshToken }).pipe(
      tap((response) => {
        localStorage.setItem('accessToken', response.accessToken);
      }),
      catchError((error) => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  isAuthenticated(): boolean {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return false;

    try {
      const tokenPayload = this.decodeToken(accessToken);
      if (tokenPayload.exp < Date.now() / 1000) return false;
      return true;
    } catch {
      return false;
    }
  }

  getUserRoles(): string[] {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return [];

    try {
      const payload = this.decodeToken(accessToken);
      return Array.isArray(payload.roles) ? payload.roles : [];
    } catch {
      return [];
    }
  }

  getUsuarioName(): string {
    const nome = localStorage.getItem('nome');
    return nome ?? 'Desconhecido';
  }

  getUsuarioId(): number | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    const payload = JSON.parse(atob(token.split('.')[1]));
    return Number(payload.sub);
  }

  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch (e) {
      console.error('Erro ao decodificar token', e);
      return null;
    }
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('nome');
    this.router.navigate(['/login']);
  }
}
