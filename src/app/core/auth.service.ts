import { LoginSeller } from './../models/login/login-seller.dto';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth';

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
    localStorage.removeItem('nome');
  }
}
