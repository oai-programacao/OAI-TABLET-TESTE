import { Component, ElementRef, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import player from 'lottie-web';

@Component({
  selector: 'app-check',
  templateUrl: './check-component.component.html',
  styleUrl: './check-component.component.scss',
  imports: [
    CommonModule
  ]
})
export class CheckComponent {

  @ViewChild('lottieContainer') lottieContainer!: ElementRef<HTMLDivElement>;

  showSuccessLottie = false;

  @Input() set trigger(value: boolean) {
    if (value) {
      this.play();
    }
  }

  private play() {
    this.showSuccessLottie = true;

    setTimeout(() => {
      if (this.lottieContainer) {
        player.loadAnimation({
          container: this.lottieContainer.nativeElement,
          path: '/check.json',
          renderer: 'svg',
          loop: false,
          autoplay: true,
        });
      }
    }, 50);

    setTimeout(() => {
      this.showSuccessLottie = false;
    }, 3000);
  }

}
