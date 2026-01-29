import { Injectable, NgZone } from '@angular/core';
import { RxStompService } from '@stomp/ng2-stompjs';
import { wsStompConfig } from './wsStompConfig';
import { ToastService } from '../toastService/toast.service';
import { Subscription } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { RxStompState } from '@stomp/rx-stomp';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  // --- estado ---
  private lastState: RxStompState = RxStompState.CLOSED;
  private lastToken: string | null = null;
  private email: string | null = null;

  // --- controle anti-loop ---
  private manualDisconnect = false;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private reconnectAttempt = 0;
  private reconnectRequested = false;

  // --- subscriptions (fixas) ---
  private stateSub?: Subscription;
  private connectedSub?: Subscription;
  private watchSub?: Subscription;
  private watchedEmail: string | null = null;

  constructor(
    private rxStompService: RxStompService,
    private ngZone: NgZone,
    private toastService: ToastService,
  ) {
    // Subscriptions fixas (cria UMA vez)
    this.bindCoreStreams();

    // App voltou ao foco: só tenta se estiver offline/fechado
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return;
      this.tryReconnectFromSystemEvent('👁️ App voltou ao foco');
    });

    // Internet voltou: tenta se estiver fechado
    window.addEventListener('online', () => {
      this.tryReconnectFromSystemEvent('🌐 Conexão restaurada');
    });
  }

  /** Chame no login (primeira vez) */
  initWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    this.connectOrUpdateToken(token);
  }

  /** Chame SEMPRE que o accessToken for renovado */
  /** Chame SEMPRE que o accessToken for renovado */
  connectOrUpdateToken(token: string): void {
    const email = this.extractEmailFromToken(token);

    // token inválido / não parseia -> desliga tudo
    if (!email) {
      this.disconnect();
      return;
    }

    // ✅ token expirado -> NÃO tenta WS (evita flood no backend)
    if (this.isTokenExpired(token)) {
      console.log('⛔ WS: token expirado, não vou conectar');
      this.disconnect(); // mata timer/backoff e evita spam
      return;
    }

    // Se token não mudou e já está OPEN/CONNECTING, não faz nada
    if (this.lastToken === token && this.isOpenOrConnecting()) {
      return;
    }

    // Atualiza estado
    const emailChanged = this.email !== email;
    this.email = email;
    this.lastToken = token;

    // Se email mudou, atualiza watch (mas só quando conectar de fato)
    if (emailChanged) {
      this.watchedEmail = null;
      this.watchSub?.unsubscribe();
      this.watchSub = undefined;
    }

    // Se já está OPEN/CONNECTING e token mudou, precisa reconectar (headers mudam no connect)
    if (this.isOpenOrConnecting()) {
      this.reconnectRequested = true;
      this.manualDisconnect = true;
      this.rxStompService.deactivate(); // vai cair em CLOSED, e aí vamos religar
      return;
    }

    // Se está CLOSED, conecta direto
    this.activateWithToken(token);
  }

  disconnect(): void {
    this.clearReconnectTimer();
    this.reconnectAttempt = 0;
    this.reconnectRequested = false;

    this.watchSub?.unsubscribe();
    this.watchSub = undefined;
    this.watchedEmail = null;

    this.manualDisconnect = true;
    this.rxStompService.deactivate();

    this.email = null;
    this.lastToken = null;

    console.log('🔴 WS desconectado');
  }

  public sendOfferRequest(dto: any): void {
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

      if (this.email) {
        console.log('🟢 WS conectado para: ' + this.email);
        this.ensureWatch();
      } else {
        console.log('🟢 WS conectado');
      }
    });

    this.stateSub = this.rxStompService.connectionState$.subscribe((state) => {
      this.lastState = state;
      // deixe esse log se quiser; se for muito barulho, comenta
      console.log('🔁 Estado da conexão:', state);

      if (state === RxStompState.CLOSED) {
        // Se foi disconnect intencional (ex: token refresh) não agenda spam
        if (this.manualDisconnect) {
          this.manualDisconnect = false;

          // Se foi um reconnect solicitado (token mudou), religa agora
          if (this.reconnectRequested) {
            this.reconnectRequested = false;
            const token = this.lastToken ?? localStorage.getItem('accessToken');
            if (token) this.activateWithToken(token);
          }

          return;
        }

        // quedas reais: faz backoff
        this.scheduleReconnect();
      }
    });
  }

  private tryReconnectFromSystemEvent(reason: string): void {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    // Só tenta se realmente não estiver conectado/tentando
    if (this.isOpenOrConnecting()) return;

    console.log(`${reason}, tentando reconectar WS`);
    this.connectOrUpdateToken(token);
  }

  private isOpenOrConnecting(): boolean {
    return (
      this.lastState === RxStompState.OPEN ||
      this.lastState === RxStompState.CONNECTING
    );
  }

  private activateWithToken(token: string): void {
    if (this.isTokenExpired(token)) {
      console.log('⛔ WS: token expirado, não vou ativar');
      this.disconnect();
      return;
    }

    this.clearReconnectTimer();

    this.rxStompService.configure({
      ...wsStompConfig,
      connectHeaders: { Authorization: `Bearer ${token}` },
    });

    console.log('[WS] activate com token válido, exp ok');
    this.rxStompService.activate();
  }

  private scheduleReconnect(): void {
    console.log('[WS] scheduleReconnect chamado');

    if (this.reconnectTimer) return;

    // ✅ sempre prefira o token mais recente do storage
    const token = localStorage.getItem('accessToken') ?? this.lastToken;
    if (!token) return;

    // ✅ token expirado => NÃO reconecta WS (evita martelar backend)
    if (this.isTokenExpired(token)) {
      console.log('⛔ WS: token expirado, não vou agendar reconnect');
      this.disconnect(); // mata timer/backoff e limpa estado
      return;
    }

    const delay = Math.min(30000, 2000 * Math.pow(2, this.reconnectAttempt++));
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;

      // Se enquanto esperava já conectou, não faz nada
      if (this.isOpenOrConnecting()) return;

      // ✅ pega token mais recente de novo
      const latestToken = localStorage.getItem('accessToken') ?? this.lastToken;
      if (!latestToken) return;

      // ✅ se expirou durante o backoff, não tenta
      if (this.isTokenExpired(latestToken)) {
        console.log(
          '⛔ WS: token expirou durante o backoff, parando reconexão',
        );
        this.disconnect();
        return;
      }

      console.log(`♻️ Reconectando WS (backoff ${delay}ms)`);
      this.activateWithToken(latestToken);
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (!this.reconnectTimer) return;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
  }

  private ensureWatch(): void {
    if (!this.email) return;

    // já está assistindo o email atual
    if (this.watchSub && this.watchedEmail === this.email) return;

    // troca de usuário/email -> recria watch
    this.watchSub?.unsubscribe();

    this.watchSub = this.rxStompService
      .watch(`/user/${this.email}/topic/seller-notifications`)
      .subscribe((msg) => {
        this.ngZone.run(() => this.handleNotification(msg.body));
      });

    this.watchedEmail = this.email;
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

  private extractEmailFromToken(token: string): string | null {
    try {
      const decoded: any = jwtDecode(token);
      return decoded?.sub ?? decoded?.email ?? null;
    } catch {
      return null;
    }
  }

  private formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  private isTokenExpired(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const expMs = (decoded?.exp ?? 0) * 1000;
      return !expMs || expMs <= Date.now();
    } catch {
      return true;
    }
  }
}
