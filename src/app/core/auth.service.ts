
import { LoginSeller } from './../models/login/login-seller.dto';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient, private router: Router) {}

  login(loginSeller: LoginSeller): Observable<any> {
    const headers = new HttpHeaders({
      'X-Client-Type': 'SELLER',
    });

    return this.http
      .post<any>(`${this.apiUrl}/login`, loginSeller, { headers })
      .pipe(
        tap((response) => {
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);
          localStorage.setItem('name', response.name);
          this.router.navigate(['/search']);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('name');
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1])); // decodifica o payload do JWT
      const expiry = payload.exp; // tempo de expiração em segundos
      const now = Math.floor(new Date().getTime() / 1000);

      return now < expiry; // true se ainda não expirou
    } catch (error) {
      console.error('Erro ao verificar token JWT', error);
      return false;
    }
  }

  getUserRoles(): string[] {
    const token = localStorage.getItem('accessToken');
    if (!token) return [];

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.roles || []; // assuming your JWT has a "roles" array
    } catch (error) {
      console.error('Erro ao decodificar roles do token', error);
      return [];
    }
  }

  getSellerId(): number | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id || null;
    } catch (error) {
      console.error('Erro ao decodificar sellerId do token', error);
      return null;
    }
  }

}
