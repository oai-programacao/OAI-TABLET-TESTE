import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter, take } from 'rxjs/operators';
import { WebSocketService } from './services/webSocket/websocket.service';
import { AuthService } from './core/auth.service';
import { FullScreenLottieComponent } from './shared/components/fullscreen-lottie/fullscreen-lottie-component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, FullScreenLottieComponent],
})
export class AppComponent implements OnInit {
  globalLottieTrigger = false;
  globalLottiePath = '';
  globalLottieDuration = 7000;

  constructor(
    private wsService: WebSocketService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    const month = new Date().getMonth() + 1;

    if (month === 10) {
      document.body.classList.add('halloween-bg');
    } else if (month === 11 || month === 12) {
      document.body.classList.add('christmas-bg');
    } else {
      document.body.classList.add('default-bg');
    }

    this.tryRedirectAtStartup();

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        take(1)
      )
      .subscribe((ev: NavigationEnd) => {
        this.tryRedirectAtStartup();
      });
  }

  private tryRedirectAtStartup() {
    const isAuth = this.authService.isAuthenticated();
    const currentUrl = this.router.url;

    if (isAuth && currentUrl === '/login') {
      this.router
        .navigate(['/search'])
        .catch((err) => console.error('[router.navigate]', err));
      return;
    }

    if (!isAuth && currentUrl !== '/login') {
      this.router
        .navigate(['/login'])
        .catch((err) => console.error('[router.navigate]', err));
    }
  }

  triggerLottie(path: string, duration = 3000) {
    this.globalLottiePath = path;
    this.globalLottieDuration = duration;
    this.globalLottieTrigger = false;

    setTimeout(() => (this.globalLottieTrigger = true), 50);
  }

  
}
