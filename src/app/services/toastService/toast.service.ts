// src/app/services/toast/toast.service.ts
import { Injectable, ApplicationRef, ComponentRef, createComponent, EnvironmentInjector } from '@angular/core';
import { AnimatedToastComponent } from '../../shared/components/animated-toast/animated-toast.component';

@Injectable({ providedIn: 'root' })
export class ToastService {

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

  show(message: string, duration = 4000) {
    const componentRef: ComponentRef<AnimatedToastComponent> = createComponent(AnimatedToastComponent, {
      environmentInjector: this.environmentInjector
    });

    // Define a mensagem
    componentRef.instance.message = message;
    // Mostra o toast
    componentRef.instance.show = true;

    // Adiciona diretamente ao body
    document.body.appendChild(componentRef.location.nativeElement);

    // Inicia o timer para desaparecer
    componentRef.instance.hideAfter(duration);

    // Remove o componente da DOM após o tempo
    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, duration + 500);
  }
}
