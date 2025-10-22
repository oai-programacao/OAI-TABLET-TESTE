import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AnimatedToastComponent } from '../../shared/components/animated-toast/animated-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private containerEl!: HTMLElement;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {
    this.createContainer();
  }

  private createContainer() {
    this.containerEl = document.createElement('div');
    this.containerEl.style.position = 'fixed';
    this.containerEl.style.top = '20px';
    this.containerEl.style.left = '50%';
    this.containerEl.style.transform = 'translateX(-50%)';
    this.containerEl.style.zIndex = '9999';
    this.containerEl.style.display = 'flex';
    this.containerEl.style.flexDirection = 'column';
    this.containerEl.style.alignItems = 'center';
    document.body.appendChild(this.containerEl);
  }

  show(message: string) {
    const componentRef: ComponentRef<AnimatedToastComponent> = createComponent(AnimatedToastComponent, {
      environmentInjector: this.environmentInjector
    });

    componentRef.instance.message = message;

    this.appRef.attachView(componentRef.hostView);
    this.containerEl.appendChild(componentRef.location.nativeElement);

    // Duração fixa de 4 segundos
    componentRef.instance.hideAfter(4000);

    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, 4500);
  }
}
