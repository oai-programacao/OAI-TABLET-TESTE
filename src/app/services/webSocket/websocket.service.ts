// src/app/services/webSocket/websocket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { filter } from 'rxjs/operators';

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
    this.email = payload.sub; // canal do seller

    // Configuração do RxStomp com reconexão automática
    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000, // tenta reconectar a cada 5 segundos
    });

    // Ativa a conexão
    this.rxStompService.activate();

    // Log de conexão
    this.rxStompService.connected$.subscribe(() => {
      console.log('✅ WS conectado para: ' + this.email);
      this.subscribeToNotifications();
    });

    this.rxStompService.connectionState$
      .pipe(filter((state) => state === 0))
      .subscribe(() => {
        console.log('⚠️ WS desconectado, tentando reconectar...');
      });
  }

  private subscribeToNotifications() {
    if (!this.email) return;

    this.rxStompService
      .watch(`/user/${this.email}/topic/seller-notifications`)
      .subscribe((msg) => {
        this.ngZone.run(() => {
          const payload = JSON.parse(msg.body);

          // Monta a mensagem no formato desejado
          const toastMessage = `ASSINATURAS<br>${payload.data.message} ${payload.data.clientName}<br>CPF: ${payload.data.clientCpf}`;

          // Mostra no toast
          this.toastService.show(toastMessage, 'info');
        });
      });
  }

  disconnect() {
    if (!this.activated) return;
    this.rxStompService.deactivate();
    this.activated = false;
    console.log('WS desconectado para: ' + this.email);
  }
}
