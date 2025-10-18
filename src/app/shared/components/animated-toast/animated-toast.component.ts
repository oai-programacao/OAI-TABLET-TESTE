import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import player from 'lottie-web';

@Component({
  selector: 'app-animated-toast',
  standalone: true,
  template: `
    <div class="toast-container" [style.display]="show ? 'flex' : 'none'">
      <div class="toast-arrow"></div>
      <div #lottieContainer class="lottie"></div>
      <div class="toast-message">{{ message }}</div>
      <div class="toast-life-bar"></div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      background: yellow;
      border-radius: 10px;
      padding: 10px 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slide-in 0.5s ease forwards;
      overflow: hidden;
    }

    /* Ícone */
    .lottie {
      width: 110px;
      height: 110px;
    }

    /* Mensagem */
    .toast-message {
      margin-left: 10px;
      font-weight: bold;
      color: #333;
    }

    /* Barrinha de vida */
    .toast-life-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 4px;
      background: #ff5252;
      width: 100%;
      animation: life-bar 4s linear forwards;
    }

    @keyframes life-bar {
      from { width: 100%; }
      to { width: 0%; }
    }

    @keyframes slide-in {
      from { transform: translate(-50%, -50px); opacity: 0; }
      to { transform: translate(-50%, 0); opacity: 1; }
    }

    @keyframes slide-out {
      from { transform: translate(-50%, 0); opacity: 1; }
      to { transform: translate(-50%, -50px); opacity: 0; }
    }
  `],
  imports: [CommonModule]
})
export class AnimatedToastComponent implements AfterViewInit {
  @Input() message = 'Hello!';
  @Input() animationPath = 'contrato.json';
  @ViewChild('lottieContainer', { static: true }) lottieContainer!: ElementRef<HTMLDivElement>;
  show = true;

  ngAfterViewInit() {
    if (this.lottieContainer) {
      player.loadAnimation({
        container: this.lottieContainer.nativeElement,
        path: this.animationPath,
        renderer: 'svg',
        loop: false,
        autoplay: true
      });
    }
  }

  hideAfter(ms: number) {
    setTimeout(() => {
      this.show = false;
    }, ms);
  }
}
