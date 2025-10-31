// src/app/services/webSocket/websocket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { AuthService } from '../../core/auth.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private activated = false;

  email!: string | null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService,
    private authService: AuthService
  ) { 
     this.authService.currentUser$.subscribe(user => {
    if (this.activated && user) {
      console.log("Reconectando WS com token atualizado...");
      this.rxStompService.deactivate();
      setTimeout(() => this.initWebSocket(), 500);
    }
  });
  }

  initWebSocket() {
    if (this.activated) return;
    this.activated = true;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    this.email = payload.sub; 
    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.rxStompService.activate();

    this.rxStompService.connected$.subscribe(() => {
      console.log('WS conectado para: ' + this.email);
    });

    this.rxStompService.connectionState$.subscribe((state) => {
      console.log('Estado da conexão: ', state);
    });

    this.rxStompService
      .watch(`/user/${this.email}/topic/seller-notifications`)
      .subscribe((msg) => {
        this.ngZone.run(() => {
          const payload = JSON.parse(msg.body);
          // Mostra no toast
          this.toastService.show(
            `O documento foi assinado com sucesso. ✔️<br>
             Cliente: <b>${payload.data.clientName}</b><br>
             CPF: <b>${this.formatCPF(payload.data.clientCpf)}</b>`
          );
        });
      });
  }

  disconnect() {
    if (!this.activated) return;
    this.rxStompService.deactivate();
    this.activated = false;
    console.log('WS desconectado' + this.email);
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
