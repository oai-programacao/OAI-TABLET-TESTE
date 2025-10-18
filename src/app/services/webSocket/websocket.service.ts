// src/app/services/webSocket/websocket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private activated = false;

  email!: string | null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService
  ) {}

  initWebSocket() {
    if (this.activated) return;
    this.activated = true;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const payload = JSON.parse(atob(token.split('.')[1]));
    this.email = payload.sub; // usar sub como canal do seller

    // Configura o RxStompService
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

          // Monta a mensagem no formato desejado
          const toastMessage = `ASSINATURAS\n${payload.data.message} ${payload.data.clientName}\nCPF: ${payload.data.clientCpf}`;

          // Mostra no toast
          this.toastService.show(toastMessage, 'info');
        });
      });
  }

  disconnect() {
    if (!this.activated) return;
    this.rxStompService.deactivate();
    this.activated = false;
    console.log('WS desconectado' + this.email);
  }
}
