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

  show(message: string, animationPath: string = 'assets/contrato.json', duration = 4000) {
    const componentRef: ComponentRef<AnimatedToastComponent> = createComponent(AnimatedToastComponent, {
      environmentInjector: this.environmentInjector
    });

    componentRef.instance.message = message;
    componentRef.instance.animationPath = animationPath;

    this.appRef.attachView(componentRef.hostView);
    this.containerEl.appendChild(componentRef.location.nativeElement);

    // Inicia a animação de vida útil
    componentRef.instance.hideAfter(duration);

    // Remove o toast da DOM após expirar
    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, duration + 500);
  }
}
