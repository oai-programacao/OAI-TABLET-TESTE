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

  /** Cria o container fixo no topo da tela */
  private createContainer() {
    this.containerEl = document.createElement('div');
    Object.assign(this.containerEl.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '9999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      pointerEvents: 'none', // não bloqueia cliques
    });
    document.body.appendChild(this.containerEl);
  }

  /** Exibe um toast simples */
  show(message: string) {
    this.createToastComponent(message);
  }

  /** Exibe um toast com animação Lottie personalizada */
  showWithAnimation(message: string, animationPath: string) {
    this.createToastComponent(message, animationPath);
  }

  /** Cria e gerencia o ciclo de vida de um toast */
  private createToastComponent(message: string, animationPath?: string) {
    const componentRef: ComponentRef<AnimatedToastComponent> = createComponent(AnimatedToastComponent, {
      environmentInjector: this.environmentInjector,
    });

    componentRef.instance.message = message;

    // Define a animação, se houver
    if (animationPath) {
      componentRef.instance.animationPath = animationPath;
    }

    // Anexa ao ciclo de vida da aplicação
    this.appRef.attachView(componentRef.hostView);
    this.containerEl.appendChild(componentRef.location.nativeElement);

    // Define duração do toast
    componentRef.instance.hideAfter(4000);

    // Remove o componente após o tempo
    setTimeout(() => {
      this.appRef.detachView(componentRef.hostView);
      componentRef.destroy();
    }, 4500);
  }
}
