import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> {
    const access = this.authService.getAccessToken();
    const refresh = this.authService.getRefreshToken();

    // sem refresh token: não tem o que fazer
    if (!refresh) {
      this.router.navigate(['/login']);
      return of(false);
    }

    // se tem access token válido, passa
    if (access && !this.isExpired(access)) {
      return this.checkRoles(route);
    }

    // access expirou -> tenta refresh
    return this.authService.refreshToken().pipe(
      switchMap(() => this.checkRoles(route)),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      }),
    );
  }

  private checkRoles(route: ActivatedRouteSnapshot): Observable<boolean> {
    const allowedRoles = route.data['roles'] as string[] | undefined;
    if (!allowedRoles?.length) return of(true);

    const userRoles = this.authService.getUserRoles();
    const hasAccess = allowedRoles.some((role) => userRoles.includes(role));
    if (!hasAccess) {
      this.router.navigate(['/acessonegado']);
      return of(false);
    }
    return of(true);
  }

  private isExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      return (decoded?.exp ?? 0) * 1000 <= Date.now();
    } catch {
      return true;
    }
  }
}
