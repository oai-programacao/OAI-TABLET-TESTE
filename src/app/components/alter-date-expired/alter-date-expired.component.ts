import { ActionsContractsService } from './../../services/actionsToContract/actions-contracts.service';
import { ContractsService } from './../../services/contracts/contracts.service';
import { Contract } from './../../models/contract/contract.dto';
import { Component, inject } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepPanels } from 'primeng/stepper';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../../models/cliente/cliente.dto';
import { ClientService } from '../../services/clients/client.service';
import { SelectModule } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { ReportsService } from '../../services/reports/reports.service';
import { Dialog } from 'primeng/dialog';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { NgxMaskDirective } from 'ngx-mask';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface ConsentTermRequest {
  proportionalValue: number;
  newDateExpired: string;
}

@Component({
  selector: 'app-alterdateexpired',
  imports: [
    CardBaseComponent,
    StepPanels,
    StepperModule,
    ButtonModule,
    SelectModule,
    CommonModule,
    DatePipe,
    FormsModule,
    Dialog,
    FloatLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    NgxMaskDirective,
    ToastModule,
  ],
  templateUrl: './alter-date-expired.component.html',
  styleUrl: './alter-date-expired.component.scss',
  providers: [MessageService],
})
export class AlterDateExpiredComponent {
  clientId!: string;
  contractId!: string;

  contract!: Contract;
  client!: Cliente;

  modalVisible: boolean = false;
  phone: string = '';

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly clientService = inject(ClientService);
  private readonly reportsService = inject(ReportsService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly messageService = inject(MessageService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];

      if (this.contractId && this.clientId) {
        this.loadContractAndClient(this.contractId, this.clientId);
      }
    });
  }

  loadContractAndClient(contractId: string, clientId: string) {
    forkJoin({
      contract: this.contractService.getContractById(contractId),
      client: this.clientService.getClientById(clientId),
    }).subscribe({
      next: ({ contract, client }) => {
        this.contract = contract;
        this.client = client;
      },
      error: (err) => {
        console.error('Erro ao carregar contrato ou cliente', err);
      },
    });
  }

  getConsentTermPdf() {
    if (!this.selectedBillingCycle) return;

    // Encontrar o objeto selecionado
    const selected = this.typesOfDateExpirationCicle.find(
      (t) => t.value === (this.selectedBillingCycle ?? '')
    );

    if (!selected) return;

    const requestBody: ConsentTermRequest = {
      proportionalValue: this.proportionalBoleto || 0,
      newDateExpired: selected.descricao,
    };

    this.reportsService
      .getConsentTermPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL); // abre o PDF em nova aba
        },
        error: (err) => {
          console.error('Erro ao gerar PDF', err);
        },
      });
  }

  voltarParaCliente() {
    this.router.navigate(['/client-contracts', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['/search']);
  }

  get formattedDateSignature(): Date | null {
    return this.contract?.dateSignature
      ? new Date(this.contract.dateSignature)
      : null;
  }

  get formattedDateStart(): Date | null {
    return this.contract?.dateStart ? new Date(this.contract.dateStart) : null;
  }

  //Calcular a diferença de dias e valores.
  //==============================//
  today: Date = new Date();

  selectedBillingCycle: number | null = null;
  proportionalBoleto: number | null = null;

  selectedTypeOfPaymentMethod: string | null = null;
  typesOfPaymentMethod = [
    { descricao: 'Boleto Bancário', value: 'Boleto' },
    { descricao: 'Débito Automático', value: 'CartaoDebito' },
    { descricao: 'Cartão de Crédito', value: 'CartaoCredito' },
    { descricao: 'Pix', value: 'Pix' },
  ];

  typesOfDateExpirationCicle = [
    { descricao: 'Nenhum', value: 'Nenhum' },
    { descricao: '01 a 31 / 01', value: '01 a 31 / 01' },
    { descricao: '02 a 01 / 02', value: '02 a 01 / 02' },
    { descricao: '03 a 02 / 03', value: '03 a 02 / 03' },
    { descricao: '04 a 03 / 04', value: '04 a 03 / 04' },
    { descricao: '05 a 04 / 05', value: '05 a 04 / 05' },
    { descricao: '06 a 05 / 06', value: '06 a 05 / 06' },
    { descricao: '07 a 06 / 07', value: '07 a 06 / 07' },
    { descricao: '08 a 07 / 08', value: '08 a 07 / 08' },
    { descricao: '09 a 08 / 09', value: '09 a 08 / 09' },
    { descricao: '10 a 09 / 10', value: '10 a 09 / 10' },
    { descricao: '11 a 10 / 11', value: '11 a 10 / 11' },
    { descricao: '12 a 11 / 12', value: '12 a 11 / 12' },
    { descricao: '13 a 12 / 13', value: '13 a 12 / 13' },
    { descricao: '14 a 13 / 14', value: '14 a 13 / 14' },
    { descricao: '15 a 14 / 15', value: '15 a 14 / 15' },
    { descricao: '16 a 15 / 16', value: '16 a 15 / 16' },
    { descricao: '17 a 16 / 17', value: '17 a 16 / 17' },
    { descricao: '18 a 17 / 18', value: '18 a 17 / 18' },
    { descricao: '19 a 18 / 19', value: '19 a 18 / 19' },
    { descricao: '20 a 19 / 20', value: '20 a 19 / 20' },
    { descricao: '21 a 20 / 21', value: '21 a 20 / 21' },
    { descricao: '22 a 21 / 22', value: '22 a 21 / 22' },
    { descricao: '23 a 22 / 23', value: '23 a 22 / 23' },
    { descricao: '24 a 23 / 24', value: '24 a 23 / 24' },
    { descricao: '25 a 24 / 25', value: '25 a 24 / 25' },
    { descricao: '26 a 25 / 26', value: '26 a 25 / 26' },
    { descricao: '27 a 26 / 27', value: '27 a 26 / 27' },
    { descricao: '28 a 27 / 28', value: '28 a 27 / 28' },
    { descricao: '29 a 28 / 29', value: '29 a 28 / 29' },
    { descricao: '30 a 29 / 30', value: '30 a 29 / 30' },
    { descricao: '31 a 30 / 31', value: '31 a 30 / 31' },
  ];

  // Cálculo proporcional do boleto
  calculateProportionalBoleto(
    contractLiquidPrice: number,
    newBillingDay: number
  ): number {
    const today = new Date();
    const currentDay = today.getDate();

    // Número de dias reais do mês atual
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();

    const dailyPrice = contractLiquidPrice / daysInMonth;

    let daysDifference = newBillingDay - currentDay;
    if (daysDifference < 0) {
      daysDifference += daysInMonth; // Usa o total real de dias do mês
    }
    return Number((dailyPrice * daysDifference).toFixed(2));
  }

  // Atualiza o valor proporcional quando o usuário muda a data
  onBillingCycleChange(): void {
    if (this.selectedBillingCycle && this.contract) {
      this.proportionalBoleto = this.calculateProportionalBoleto(
        this.contract.liquidPrice!,
        this.selectedBillingCycle
      );
    } else {
      this.proportionalBoleto = null;
    }
  }

  abrirModal() {
    this.modalVisible = true;
  }

  onHide() {
    this.modalVisible = false;
    this.phone = '';
  }

  sendToAutentiqueSubmit() {
    const term = {
      proportionalValue: this.proportionalBoleto,
      newDateExpired: this.selectedBillingCycle || '', // envia direto
      paymentMethod: this.selectedTypeOfPaymentMethod || '',
    };

    const mappedSigners = [
      { name: this.client.name, phone: '+55' + this.phone },
    ];

    const payload = { term, signers: mappedSigners };

    this.actionsContractsService
      .sendAlterDateAutentique(payload, this.clientId, this.contractId)
      .subscribe({
        next: (res: string) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: res,
            life: 15000,
          });
          this.modalVisible = false;
        },
        error: (err) => {
          const backendMessage =
            typeof err.error === 'string'
              ? err.error
              : 'Erro ao tentar enviar para o Autentique!';

          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: backendMessage,
            life: 15000,
          });
        },
      });
  }
}
