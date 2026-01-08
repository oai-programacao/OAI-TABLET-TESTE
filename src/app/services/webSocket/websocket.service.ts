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
  ) { }

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
              this.toastService.show(
                `🔔 Notificação recebida: <b>${event}</b>`
              );
          }
        });
      });
  }

  public sendOfferRequest(dto: any): void {
    this.rxStompService.publish({
      destination: '/app/offer.request',
      body: JSON.stringify(dto),
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

//.
