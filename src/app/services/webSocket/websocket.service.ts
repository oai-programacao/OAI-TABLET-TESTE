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

  // Watch
  private watchSub?: Subscription;
  private watchedEmail: string | null = null;

  // Reconexão (um único mecanismo)
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempt = 0;

  // Controle para troca de token (evita scheduleReconnect na queda “intencional”)
  private manualDisconnect = false;
  private reconnectRequested = false;

  // Circuit breaker anti-flood (auth)
  private authBlockedUntil = 0; // timestamp ms

  // Subs fixas
  private stateSub?: Subscription;
  private connectedSub?: Subscription;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService,
  ) {
    this.bindCoreStreams();

    // Internet voltou: tenta se estiver fechado
    window.addEventListener('online', () => {
      this.tryReconnect('🌐 Conexão restaurada');
    });
  }

  /** Chame no login */
  initWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (token) this.connectOrUpdateToken(token);
  }

  /**
   * Chame SEMPRE que o AuthService atualizar o accessToken.
   * (O WS não faz refresh. Apenas reconecta com o token novo.)
   */
  connectOrUpdateToken(token: string): void {
    const email = this.extractEmailFromToken(token);

    // token inválido -> encerra tudo
    if (!email) {
      this.disconnect();
      return;
    }

    // token expirado (com skew) -> NÃO conecta (evita flood)
    if (this.isTokenExpired(token)) {
      this.blockAuthTemporarily(
        '⛔ WS: token expirado, aguardando AuthService renovar',
      );
      this.disconnect();
      return;
    }

    // se for o mesmo token e já está conectando/conectado, não faz nada
    if (this.token === token && this.isOpenOrConnecting()) return;

    const emailChanged = this.email !== email;
    this.email = email;
    this.token = token;

    if (emailChanged) {
      this.clearWatch();
    }

    // Se já estava open/connecting, precisa reconectar para aplicar header novo
    if (this.isOpenOrConnecting()) {
      this.reconnectRequested = true;
      this.manualDisconnect = true;
      this.rxStompService.deactivate();
      return;
    }

    // Se estava fechado, ativa direto
    this.activate();
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;

    this.clearWatch();

    this.manualDisconnect = true;
    this.rxStompService.deactivate();

    this.email = null;
    this.token = null;

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
      this.reconnectAttempt = 0;
      this.clearReconnectTimer();

      console.log(
        this.email ? `🟢 WS conectado para: ${this.email}` : '🟢 WS conectado',
      );
      this.ensureWatch();
    });

    this.stateSub = this.rxStompService.connectionState$.subscribe((s) => {
      this.state = s;
      // console.log('🔁 Estado WS:', s);

      if (s !== RxStompState.CLOSED) return;

      // queda “intencional” (ex: trocou token e vamos reativar)
      if (this.manualDisconnect) {
        this.manualDisconnect = false;

        if (this.reconnectRequested) {
          this.reconnectRequested = false;
          // ativa com token mais novo
          this.activate();
        }
        return;
      }

      // quedas reais: backoff
      this.scheduleReconnect();
    });
  }

  private activate(): void {
    // anti-flood se auth acabou de falhar várias vezes
    if (Date.now() < this.authBlockedUntil) {
      console.log('⏸️ WS: reconexão bloqueada temporariamente (auth)');
      return;
    }

    const token = localStorage.getItem('accessToken') ?? this.token;
    if (!token) return;

    if (this.isTokenExpired(token)) {
      this.blockAuthTemporarily(
        '⛔ WS: token expirado, não vou ativar (aguarde refresh)',
      );
      this.disconnect();
      return;
    }

    this.clearReconnectTimer();

    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    console.log('[WS] activate (token ok)');
    this.rxStompService.activate();
  }

  private scheduleReconnect(): void {
    // se já tem timer, não agenda outro
    if (this.reconnectTimer) return;

    // não reconecta se estamos em “bloqueio de auth”
    if (Date.now() < this.authBlockedUntil) return;

    const token = localStorage.getItem('accessToken') ?? this.token;
    if (!token) return;

    // token expirado => para e espera AuthService renovar
    if (this.isTokenExpired(token)) {
      this.blockAuthTemporarily(
        '⛔ WS: token expirado, não vou reconectar (aguarde refresh)',
      );
      this.disconnect();
      return;
    }

    const delay = Math.min(30000, 2000 * Math.pow(2, this.reconnectAttempt++));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;

      // se já conectou nesse meio tempo, não faz nada
      if (this.isOpenOrConnecting()) return;

      // pega token mais novo de novo
      const latest = localStorage.getItem('accessToken') ?? this.token;
      if (!latest) return;

      if (this.isTokenExpired(latest)) {
        this.blockAuthTemporarily(
          '⛔ WS: token expirou durante backoff, aguardando refresh',
        );
        this.disconnect();
        return;
      }

      console.log(`♻️ Reconectando WS (backoff ${delay}ms)`);
      this.activate();
    }, delay);
  }

  private tryReconnect(reason: string): void {
    if (this.isOpenOrConnecting()) return;
    if (Date.now() < this.authBlockedUntil) return;

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    console.log(`${reason}, tentando reconectar WS`);
    this.connectOrUpdateToken(token);
  }

  private isOpenOrConnecting(): boolean {
    return (
      this.state === RxStompState.OPEN || this.state === RxStompState.CONNECTING
    );
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
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

  private blockAuthTemporarily(msg: string): void {
    // Evita martelar o servidor quando auth está ruim.
    // Espera o AuthService renovar e disparar connectOrUpdateToken(novoToken).
    this.authBlockedUntil = Date.now() + 30_000; // 30s de pausa
    console.log(msg);
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

      // skew evita “expirou no caminho” (rede lenta / iOS background)
      const skewMs = 30_000;
      return !expMs || expMs <= Date.now() + skewMs;
    } catch {
      return true;
    }
  }

  // Seu handler original (mantive)
  private handleNotification(body: string): void {
    const payload = JSON.parse(body);
    const event = payload.eventName;
    const data = payload.data;

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
        this.toastService.show(`🔔 Notificação recebida: <b>${event}</b>`);
    }
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
}
