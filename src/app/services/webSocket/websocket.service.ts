import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { RxStompState } from '@stomp/rx-stomp';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  // Estado
  private state: RxStompState = RxStompState.CLOSED;
  private token: string | null = null;
  private email: string | null = null;

  // Subs fixas
  private stateSub?: Subscription;
  private connectedSub?: Subscription;

  // Watch
  private watchSub?: Subscription;
  private watchedEmail: string | null = null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService,
  ) {
    this.bindCoreStreams();
  }

  /** Chame no login */
  initWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (token) this.connectOrUpdateToken(token);
  }

  /**
   * Chame SEMPRE que o AuthService atualizar o accessToken.
   * O WS NÃO faz refresh — só reinicia pra aplicar o header novo.
   */
  connectOrUpdateToken(token: string): void {
    const email = this.extractEmailFromToken(token);

    // token inválido -> encerra
    if (!email) {
      this.disconnect();
      return;
    }

    // token expirado -> não conecta (evita loop)
    if (this.isTokenExpired(token)) {
      this.disconnect();
      return;
    }

    // se é o mesmo token e já está OPEN/CONNECTING, não faz nada
    if (this.token === token && this.isOpenOrConnecting()) return;

    const emailChanged = this.email !== email;
    this.email = email;
    this.token = token;

    if (emailChanged) this.clearWatch();

    // se já está conectado/conectando, precisa reiniciar pra aplicar novo header
    if (this.isOpenOrConnecting()) {
      this.rxStompService.deactivate();
      // quando fechar, nós reativamos (abaixo) com token novo
      return;
    }

    this.activateWithCurrentToken();
  }

  disconnect(): void {
    this.clearWatch();
    this.email = null;
    this.token = null;

    this.rxStompService.deactivate();
    console.log('🔴 WS desconectado');
  }

  sendOfferRequest(dto: any): void {
    this.rxStompService.publish({
      destination: '/app/offer.request',
      body: JSON.stringify(dto),
    });
  }

  // -------------------------
  // Internals
  // -------------------------

  private bindCoreStreams(): void {
    if (this.connectedSub || this.stateSub) return;

    this.connectedSub = this.rxStompService.connected$.subscribe(() => {
      console.log(
        this.email ? `🟢 WS conectado para: ${this.email}` : '🟢 WS conectado',
      );
      this.ensureWatch();
    });

    this.stateSub = this.rxStompService.connectionState$.subscribe((state) => {
      this.state = state;

      // ✅ Aqui NÃO fazemos reconnect manual.
      // Quem reconecta é o reconnectDelay do wsStompConfig.
      // A única coisa que fazemos é: quando fechou por troca de token, reativar.
      switch (state) {
        case RxStompState.CLOSED: {
          // Se estamos com token válido, garantimos que o WS fique ativo.
          // (Se cair por rede, o RxStomp reconecta sozinho.)
          const token = localStorage.getItem('accessToken') ?? this.token;
          if (!token) return;

          // token inválido/expirado -> não reativa (evita flood)
          if (this.isTokenExpired(token)) return;

          // Se o RxStomp estiver desativado (deactivate por troca de token),
          // precisamos reativar pra aplicar o header novo.
          // Isso não vira loop porque só roda quando state=CLOSED
          // e o token é válido.
          this.activateWithCurrentToken();
          break;
        }

        default:
          break;
      }
    });
  }

  private activateWithCurrentToken(): void {
    const token = localStorage.getItem('accessToken') ?? this.token;
    if (!token) return;

    if (this.isTokenExpired(token)) {
      this.disconnect();
      return;
    }

    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    console.log('[WS] activate()');
    this.rxStompService.activate();
  }

  private isOpenOrConnecting(): boolean {
    return (
      this.state === RxStompState.OPEN || this.state === RxStompState.CONNECTING
    );
  }

  private clearWatch(): void {
    this.watchSub?.unsubscribe();
    this.watchSub = undefined;
    this.watchedEmail = null;
  }

  private ensureWatch(): void {
    if (!this.email) return;
    if (this.watchSub && this.watchedEmail === this.email) return;

    this.clearWatch();

    this.watchSub = this.rxStompService
      .watch(`/user/${this.email}/topic/seller-notifications`)
      .subscribe((msg) =>
        this.ngZone.run(() => this.handleNotification(msg.body)),
      );

    this.watchedEmail = this.email;
  }

  private extractEmailFromToken(token: string): string | null {
    try {
      const decoded: any = jwtDecode(token);
      return decoded?.sub ?? decoded?.email ?? null;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const expMs = (decoded?.exp ?? 0) * 1000;
      const skewMs = 30_000;
      return !expMs || expMs <= Date.now() + skewMs;
    } catch {
      return true;
    }
  }

  // -------------------------
  // Notificações (SEU SWITCH CASE COMPLETO)
  // -------------------------

  private handleNotification(body: string): void {
    const payload = JSON.parse(body);
    const event = payload.eventName;
    const data = payload.data;

    console.log('📨 Payload recebido:', payload);

    switch (event) {
      case 'DOCUMENT_SIGNED':
        this.toastService.showWithAnimation(
          `📄 O termo de consentimento foi assinado com sucesso!<br>
✅ Um novo atendimento foi assinado automaticamente para esta ação.<br>  
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
        this.toastService.show(`🔔 Notificação recebida: <b>${event}</b>`);
    }
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
