// toast.service.ts
import { Injectable, ApplicationRef, ComponentRef, createComponent, Injector } from '@angular/core';
import { AnimatedToastComponent } from '../../shared/components/animated-toast/animated-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private containerEl!: HTMLElement;

  constructor(private injector: Injector, private appRef: ApplicationRef) {
    this.createContainer();
  }

  private createContainer() {
    this.containerEl = document.createElement('div');
    this.containerEl.style.position = 'fixed';
    this.containerEl.style.top = '20px';
    this.containerEl.style.right = '20px';
    this.containerEl.style.zIndex = '9999';
    document.body.appendChild(this.containerEl);
  }

  show(message: string, animationPath: string = '/contrato.json', duration = 4000) {
    const componentRef: ComponentRef<AnimatedToastComponent> = createComponent(AnimatedToastComponent, {
      environmentInjector: this.appRef.injector
    });

    componentRef.instance.message = message;
    componentRef.instance.animationPath = animationPath;

    this.appRef.attachView(componentRef.hostView);
    this.containerEl.appendChild(componentRef.location.nativeElement);

    componentRef.instance.hideAfter(duration);

    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, duration + 500);
  }

}
