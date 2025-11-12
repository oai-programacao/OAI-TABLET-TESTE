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
    this.email = payload.sub;
    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.rxStompService.activate();

    this.rxStompService.connected$.subscribe(() => {
      console.log('🟢 WS conectado para: ' + this.email);
    });

    this.rxStompService.connectionState$.subscribe((state) => {
      console.log('🔁 Estado da conexão: ', state);
    });

    this.rxStompService
      .watch(`/user/${this.email}/topic/seller-notifications`)
      .subscribe((msg) => {
        this.ngZone.run(() => {
          const payload = JSON.parse(msg.body);
          const event = payload.eventName;
          const data = payload.data;

          console.log('📨 Payload recebido:', payload);

          switch (event) {
            case 'DOCUMENT_SIGNED':
              this.toastService.showWithAnimation(
                `📄 O termo de consentimento foi assinado com sucesso!<br>
             ✅ Um novo atendimento foi criado automaticamente para esta ação.<br>  
             Cliente: <b>${data.clientName}</b><br>
             CPF: <b>${this.formatCPF(data.clientCpf)}</b>`,
                '/contrato.json'
              );
              break;

            case 'BILL_PAID_ALTER_DATE':
              this.toastService.showWithAnimation(
                `💰 Pagamento compensado para <b>${data.clientName}</b>!
                Referente ao contrato: <b>#${data.numberContractRbx}</b>
                <br> O vencimento foi alterado com sucesso para <b>${data.newDate}</b>
                <br>Financeiro estornado e lançado novo carnê 12 meses.</b>.`,
                '/money.json'
              );
              break;

            case 'ALTER_DATE_EXPIRED':
              this.toastService.showWithAnimation(
                `📆 Vencimento do contrato foi alterado.<br>
             Cliente: <b>${data.clientName}</b>`,
                '/calendario.json'
              );
              break;

            default:
              this.toastService.show(
                `🔔 Notificação recebida: <b>${event}</b>`
              );
          }
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
