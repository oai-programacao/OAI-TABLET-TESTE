import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import player from 'lottie-web';

@Component({
  selector: 'app-fullscreen-lottie',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fullscreen-lottie.component.html',
  styleUrls: ['./fullscreen-lottie.component.scss'],
})
export class FullScreenLottieComponent {
  @ViewChild('lottieContainer') lottieContainer!: ElementRef<HTMLDivElement>;
  @Input() duration: number = 7000;
  show = false;

  @Input() animationPath: string = '';

  @Input() set trigger(value: boolean) {
    if (value && this.animationPath) this.play();
  }

  private play() {
    this.show = true;

    setTimeout(() => {
      player.loadAnimation({
        container: this.lottieContainer.nativeElement,
        path: this.animationPath,
        renderer: 'svg',
        loop: false,
        autoplay: true,
      });
    });

    setTimeout(() => {
      this.show = false;
    }, this.duration);
  }
}
