import { CommonModule } from '@angular/common';
import { Component, Input, AfterViewInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import player from 'lottie-web';

@Component({
  selector: 'app-animated-toast',
  standalone: true,
  template: `
    <div class="toast-container" [style.display]="show ? 'flex' : 'none'">
      <div class="toast-arrow"></div>
      <div #lottieContainer class="lottie"></div>
      <div class="toast-header">ASSINATURAS</div>
      <div class="toast-message" [innerHTML]="formattedMessage"></div>
      <button class="toast-close" (click)="close()">×</button>
      <div class="toast-life-bar"></div>
    </div>
  `,
  styles: [
    `
      .toast-header {
        font-weight: 700;
        font-size: 18px;
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: #222;
      }

      .toast-container {
        position: fixed;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: rgba(92, 212, 248, 0.9);
        border-radius: 5px;
        min-width: 400px;
        max-width: 600px;
        height: auto;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slide-in 0.5s ease forwards;
        overflow: hidden;
        position: relative;
        pointer-events: auto;
      }

      .lottie {
        width: 140px;
        height: 140px;
      }

      .toast-message {
        margin: 10px 10px 10px 10px;
        font-weight: 500;
        font-size: 15px;
        color: #2d2d2d;
        line-height: 1.5;
        text-align: center;
        white-space: pre-line;
      }

      /* Botão de fechar */
      .toast-close {
        position: absolute;
        top: 5px;
        right: 10px;
        border: none;
        background: transparent;
        font-size: 18px;
        font-weight: bold;
        cursor: pointer;
        color: #333;
      }
      .toast-close:hover {
        color: #000;
      }

      .toast-life-bar {
        position: absolute;
        bottom: 0;
        left: 0;
        height: 4px;
        background: #ffb547ff;
        width: 100%;
        animation: life-bar 15s linear forwards;
      }

      @keyframes life-bar {
        from {
          width: 100%;
        }
        to {
          width: 0%;
        }
      }

      @keyframes slide-in {
        from {
          transform: translate(-50%, -50px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }

      @keyframes slide-out {
        from {
          transform: translate(-50%, 0);
          opacity: 1;
        }
        to {
          transform: translate(-50%, -50px);
          opacity: 0;
        }
      }
    `,
  ],
  imports: [CommonModule],
})
export class AnimatedToastComponent implements AfterViewInit {
  private _message = '';
  private _animationPath = '';
  formattedMessage = '';
  show = true;

  @ViewChild('lottieContainer', { static: true })
  lottieContainer!: ElementRef<HTMLDivElement>;
  @Output() closed = new EventEmitter<void>();
  

  @Input()
  set message(value: string) {
    this._message = value;
    this.formattedMessage = value.replace(/\n/g, '<br/>');
  }
  get message() {
    return this._message;
  }

  @Input()
  set animationPath(value: string) {
    if (!value) return;
    this._animationPath = value;

    if (this.lottieContainer) {
      player.loadAnimation({
        container: this.lottieContainer.nativeElement,
        path: value,
        renderer: 'svg',
        loop: false,
        autoplay: true,
      });
    }
  }

  ngAfterViewInit() {
  }

  hideAfter(ms: number) {
    setTimeout(() => (this.show = false), ms);
  }

  close() {
    this.show = false;
    this.closed.emit(); 
  }
}
