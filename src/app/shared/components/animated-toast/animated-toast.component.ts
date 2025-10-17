import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, ElementRef, ViewChild} from '@angular/core';
import player from 'lottie-web';

@Component({
  selector: 'app-animated-toast',
  standalone: true,
  template: `
    <div class="toast-container" *ngIf="show">
      <div #lottieContainer style="width:80px; height:80px;"></div>
      <div class="toast-message">{{ message }}</div>
    </div>
  `,
  styles: [`
    .toast-container { display: flex; align-items: center; background: #fff; border-radius: 10px;
      padding: 10px; margin-top: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); animation: slide-in 0.5s ease forwards;
      min-width: 250px; position: relative; }
    .toast-message { margin-left: 10px; font-weight: bold; }
    @keyframes slide-in { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  `],
  imports: [CommonModule]
})
export class AnimatedToastComponent implements AfterViewInit {
  @Input() message = 'Hello!';
  @Input() animationPath = '/contrato.json';
  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;
  show = true;

  ngAfterViewInit() {
    player.loadAnimation({
      container: this.lottieContainer.nativeElement,
      path: this.animationPath,
      renderer: 'svg',
      loop: false,
      autoplay: true
    });
  }

  hideAfter(ms: number) {
    setTimeout(() => this.show = false, ms);
  }
}
