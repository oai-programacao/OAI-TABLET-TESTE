import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    const allowedRoles = route.data['roles'] as string[] | undefined;

    if (allowedRoles && allowedRoles.length > 0) {
      const userRoles = this.authService.getUserRoles();

      const hasAccess = allowedRoles.some(role => userRoles.includes(role));

      if (!hasAccess) {
        this.router.navigate(['/acessonegado']);
        return of(false);
      }
    }

    return of(true);
  }
}
