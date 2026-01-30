// websocket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private activated = false;
  private subscriptions: Subscription[] = [];
  private email: string | null = null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService
  ) {}

  initWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // se já ativou, não duplica
    if (this.activated) return;

    this.connectWithToken(token);
  }

  /** ✅ CHAME QUANDO O TOKEN FOR ATUALIZADO (refresh/login) */
  updateTokenAndReconnect(token: string): void {
    // Se ainda não ativou, só conecta
    if (!this.activated) {
      this.connectWithToken(token);
      return;
    }

    // Se já está ativo: precisa reconectar para aplicar header novo
    this.disconnect();
    this.connectWithToken(token);
  }

  private connectWithToken(token: string): void {
    const payload = this.safeParseJwtPayload(token);
    const email = payload?.sub;
    if (!email) return;

    this.email = email;

    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    this.rxStompService.activate();
    this.activated = true;

    this.subscriptions.push(
      this.rxStompService.connected$.subscribe(() => {
        console.log('🟢 WS conectado para: ' + this.email);
      })
    );

    this.subscriptions.push(
      this.rxStompService.connectionState$.subscribe((state) => {
        console.log('🔁 Estado da conexão: ', state);
      })
    );

    this.subscriptions.push(
      this.rxStompService
        .watch(`/user/${this.email}/topic/seller-notifications`)
        .subscribe((msg) => {
          this.ngZone.run(() => this.handleNotification(msg.body));
        })
    );
  }

  disconnect(): void {
    if (!this.activated) return;

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.rxStompService.deactivate();
    this.activated = false;

    console.log('🔴 WS desconectado para: ' + this.email);
  }

  private handleNotification(body: string): void {
    const payload = JSON.parse(body);
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

      case 'offer_status_accept':
        this.toastService.showWithAnimation(
          `✅ Sua oferta foi <b>aceita</b>!<br>
Quem aceitou: <b>${data.actionByName}</b>`,
          '/sucessordem.json'
        );
        break;

      case 'offer_status_reject':
        this.toastService.showWithAnimation(
          `❌ Sua oferta foi <b>rejeitada</b>!<br>
Quem rejeitou: <b>${data.actionByName}</b>`,
          '/rejectedordem.json'
        );
        break;

      case 'NEW_SALE':
        this.toastService.showWithAnimation(
          `🚀 <b>Nova venda registrada com sucesso!</b><br>
Cliente: <b>${data.clientName}</b><br>
CPF: <b>${this.formatCPF(data.clientCpf)}</b><br>
Plano contratado: <b>${data.codePlan}</b><br>
Nº do contrato: <b>#${data.numberContractRbx}</b>`,
          '/saleRocket.json'
        );
        break;

      case 'UPDATE_ADDRESS':
        this.toastService.showWithAnimation(
          `🚀 Endereço atualizado com sucesso!<br>
Cliente: <b>${data.clientName}</b><br>
Contrato: <b>${data.numberContractRbx}</b><br>`,
          '/sucessordem.json'
        );
        break;

      case 'TRANSFER_OWNERSHIP':
        this.toastService.showWithAnimation(
          `🚀 Os dois clientes assinaram o termo de consentimento!<br>
Cliente: <b>${data.clientName}</b> teve seu contrato transferido.<br>
Contrato: <b>${data.numberContractRbx}</b> transferido com sucesso !<br>`,
          '/handshake.json'
        );
        break;

      case 'upgrade':
        this.toastService.showWithAnimation(
          `🚀 O cliente assinou o termo de consentimento!<br>
Cliente: <b>${data.clientName}</b> teve seu contrato atualizado.<br>
Contrato: <b>${data.numberContractRbx}</b> Upgrade realizado com sucesso!<br>`,
          '/handshake.json'
        );
        break;

      case 'downgrade':
        this.toastService.showWithAnimation(
          `🚀 O cliente assinou o termo de consentimento!<br>
Cliente: <b>${data.clientName}</b> teve seu contrato atualizado.<br>
Contrato: <b>${data.numberContractRbx}</b> Downgrade realizado com sucesso!<br>`,
          '/handshake.json'
        );
        break;

      case 'TEMPORARY_SUSPENSION':
        this.toastService.showWithAnimation(
          `🚀 O cliente assinou o termo de consentimento!<br>
Cliente: <b>${data.clientName}</b> teve seu contrato suspenso.<br>
Contrato: <b>${data.numberContractRbx}</b> Suspensão realizada com sucesso!<br>`,
          '/handshake.json'
        );
        break;

      case 'cancel_temporary_suspension':
        this.toastService.showWithAnimation(
          `🚀 O cliente assinou o termo de consentimento!<br>
Cliente: <b>${data.clientName}</b> teve seu contrato agendado para suspensão.<br>
Contrato: <b>${data.numberContractRbx}</b> agendamento realizado com sucesso!<br>`,
          '/handshake.json'
        );
        break;

      default:
        this.toastService.show(`🔔 Notificação recebida: <b>${event}</b>`);
    }
  }

  private safeParseJwtPayload(token: string): any | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
