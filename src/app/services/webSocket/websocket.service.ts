import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { RxStompState } from '@stomp/rx-stomp';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private activated = false;
  private subscriptions: Subscription[] = [];
  email: string | null = null;
  private reconnectTimer?: any;
  private reconnectAttempt = 0;
  private lastToken: string | null = null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService,
  ) {
    // Quando o app volta do background (PWA / aba minimizada)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('accessToken');
        if (token) {
          console.log('👁️ App voltou ao foco, tentando reconectar WS');
          this.reconnectWithToken(token);
        }
      }
    });

    // Quando a internet volta
    window.addEventListener('online', () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log('🌐 Conexão restaurada, tentando reconectar WS');
        this.reconnectWithToken(token);
      }
    });
  }

  /** Chame no login (primeira vez) */
  initWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    this.reconnectWithToken(token);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    const delay = Math.min(30000, 2000 * Math.pow(2, this.reconnectAttempt++)); // 2s, 4s, 8s... máx 30s
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;

      const token = localStorage.getItem('accessToken');
      if (token) {
        console.log(`♻️ Tentando reconectar WS em ${delay}ms...`);
        this.reconnectWithToken(token);
      }
    }, delay);
  }

  /** Chame SEMPRE que o accessToken for renovado */
  reconnectWithToken(token: string): void {
    // evita crash com token inválido/truncado
    const email = this.extractEmailFromToken(token);
    if (!email) {
      this.disconnect();
      return;
    }

    if (this.lastToken === token && this.activated) return;
    this.lastToken = token;

    if (this.activated) {
      this.disconnect();
    }

    this.email = email;
    this.activated = true;

    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.rxStompService.activate();

    // logs
    this.subscriptions.push(
      this.rxStompService.connected$.subscribe(() => {
        // ✅ conexão STOMP confirmada
        this.reconnectAttempt = 0;

        // ✅ cancela qualquer reconnect pendente
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = undefined;
        }

        console.log('🟢 WS conectado para: ' + this.email);
      }),
    );

    this.subscriptions.push(
      this.rxStompService.connectionState$.subscribe((state) => {
        console.log('🔁 Estado da conexão: ', state);

        if (state === RxStompState.OPEN) {
          this.reconnectAttempt = 0;
        }

        if (state === RxStompState.CLOSED) {
          this.scheduleReconnect();
        }
      }),
    );

    // (re)inscreve no tópico
    this.subscriptions.push(
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
                  '/contrato.json',
                );
                break;

              case 'BILL_PAID_ALTER_DATE':
                this.toastService.showWithAnimation(
                  `💰 Pagamento compensado para <b>${data.clientName}</b>!
                Referente ao contrato: <b>#${data.numberContractRbx}</b>
                <br> O vencimento foi alterado com sucesso para <b>${data.newDate}</b>
                <br>Financeiro estornado e lançado novo carnê 12 meses.</b>.`,
                  '/money.json',
                );
                break;

              case 'offer_status_accept':
                this.toastService.showWithAnimation(
                  `✅ Sua oferta foi <b>aceita</b>!<br>
                Quem aceitou: <b>${data.actionByName}</b>`,
                  '/sucessordem.json',
                );
                break;

              case 'offer_status_reject':
                this.toastService.showWithAnimation(
                  `❌ Sua oferta foi <b>rejeitada</b>!<br>
                Quem rejeitou: <b>${data.actionByName}</b>`,
                  '/rejectedordem.json',
                );
                break;

              case 'NEW_SALE':
                this.toastService.showWithAnimation(
                  `🚀 <b>Nova venda registrada com sucesso!</b><br>
                Cliente: <b>${data.clientName}</b><br>
                CPF: <b>${this.formatCPF(data.clientCpf)}</b><br>
                Plano contratado: <b>${data.codePlan}</b><br>
                Nº do contrato: <b>#${data.numberContractRbx}</b>`,
                  '/saleRocket.json',
                );
                break;

              case 'UPDATE_ADDRESS':
                this.toastService.showWithAnimation(
                  `🚀 Endereço atualizado com sucesso!<br>
                Cliente: <b>${data.clientName}</b><br>
                Contrato: <b>${data.numberContractRbx}</b><br>`,
                  '/sucessordem.json',
                );
                break;

              case 'TRANSFER_OWNERSHIP':
                this.toastService.showWithAnimation(
                  `🚀 Os dois clientes assinaram o termo de consentimento!<br>
                Cliente: <b>${data.clientName}</b> teve seu contrato transferido.<br>
                Contrato: <b>${data.numberContractRbx}</b> transferido com sucesso !<br>`,
                  '/handshake.json',
                );
                break;

              case 'upgrade':
                this.toastService.showWithAnimation(
                  `🚀 O cliente assinou o termo de consentimento!<br>
                Cliente: <b>${data.clientName}</b> teve seu contrato atualizado.<br>
                Contrato: <b>${data.numberContractRbx}</b> Upgrade realizado com sucesso!<br>`,
                  '/handshake.json',
                );
                break;

              case 'downgrade':
                this.toastService.showWithAnimation(
                  `🚀 O cliente assinou o termo de consentimento!<br>
                Cliente: <b>${data.clientName}</b> teve seu contrato atualizado.<br>
                Contrato: <b>${data.numberContractRbx}</b> Downgrade realizado com sucesso!<br>`,
                  '/handshake.json',
                );
                break;

              case 'TEMPORARY_SUSPENSION':
                this.toastService.showWithAnimation(
                  `🚀 O cliente assinou o termo de consentimento!<br>
                Cliente: <b>${data.clientName}</b> teve seu contrato suspenso.<br>
                Contrato: <b>${data.numberContractRbx}</b> Suspensão realizada com sucesso!<br>`,
                  '/handshake.json',
                );
                break;

              case 'cancel_temporary_suspension':
                this.toastService.showWithAnimation(
                  `🚀 O cliente assinou o termo de consentimento!<br>
                Cliente: <b>${data.clientName}</b> teve seu contrato agendado para suspensão.<br>
                Contrato: <b>${data.numberContractRbx}</b> agendamento realizado com sucesso!<br>`,
                  '/handshake.json',
                );
                break;

              default:
                this.toastService.show(
                  `🔔 Notificação recebida: <b>${event}</b>`,
                );
            }
          });
        }),
    );
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    this.reconnectAttempt = 0;

    if (!this.activated) {
      this.email = null;
      this.lastToken = null;
      return;
    }

    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];

    this.rxStompService.deactivate();
    this.activated = false;

    console.log('🔴 WS desconectado para: ' + (this.email ?? '(desconhecido)'));
    this.email = null;
    this.lastToken = null;
  }

  public sendOfferRequest(dto: any): void {
    this.rxStompService.publish({
      destination: '/app/offer.request',
      body: JSON.stringify(dto),
    });
  }

  private extractEmailFromToken(token: string): string | null {
    try {
      const decoded: any = jwtDecode(token);
      // seu token parece usar email no "sub"
      return decoded?.sub ?? decoded?.email ?? null;
    } catch {
      return null;
    }
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
