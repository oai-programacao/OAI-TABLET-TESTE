import { ImageUtilsService } from './../../services/midia/image-utils.service';
import { ActionsContractsService } from './../../services/actionsToContract/actions-contracts.service';
import { ContractsService } from './../../services/contracts/contracts.service';
import {
  Contract,
  RequestDateTransfer,
} from './../../models/contract/contract.dto';
import { Component, ElementRef, inject, ViewChild } from '@angular/core';
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
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { MidiaService } from '../../services/midia/midia.service';
import { IftaLabelModule } from 'primeng/iftalabel';
import { DividerModule } from 'primeng/divider';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { CheckComponent } from '../../shared/components/check-component/check-component.component';

export interface ConsentTermRequest {
  proportionalValue: number;
  newDateExpired: string;
}

export interface ConsentTermRequestHandle {
  proportionalValue: number;
  newDateExpired: string;
  paymentMethod: string;
  signature: string;
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
    IftaLabelModule,
    SignaturePadComponent,
    DividerModule,
    TableModule,
    CardModule,
    CheckComponent,
  ],
  templateUrl: './alter-date-expired.component.html',
  styleUrl: './alter-date-expired.component.scss',
  providers: [MessageService],
})
export class AlterDateExpiredComponent {
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;

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
  private readonly sanitizer = inject(DomSanitizer);
  private readonly imageUtilsService = inject(ImageUtilsService);
  private readonly midiaService = inject(MidiaService);
  private signedPdfBlob: Blob | null = null;

  isLoadingPreview = false;
  previewLoadFailed = false;
  safePdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewUrl: string | null = null;

  signDialogVisible = false;
  capturedSignature: string | null = null;

  signatureVisibleFlag = false;
  isPreviewDialogVisible: boolean = false;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;

  isLoadingTransfer: boolean = false;
  loadingMessage: string = '';
  fluxo: string = 'alter_date_expired';

  isUpdatingContract = false;
  showPhoneDialog: boolean = false;
  tocarCheck = false;

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
      (t) => t.value === this.selectedBillingCycle
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

  private showSuccess(summary: string, detail: string, life: number = 3000) {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }
  private showError(summary: string, detail: string) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
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

  selectedBillingCycle: number | null = null;
  proportionalBoleto: number | null = null;
  finalization: boolean = false;
  result: any = null;

  selectedTypeOfPaymentMethod: string | null = null;

  typesOfPaymentMethod = [{ descricao: 'Boleto Bancário', value: 'Boleto' }];

  typesOfDateExpirationCicle = [
    { descricao: 'Nenhum' },
    { descricao: '01 a 31 / 01', value: 1 },
    { descricao: '02 a 01 / 02', value: 2 },
    { descricao: '03 a 02 / 03', value: 3 },
    { descricao: '04 a 03 / 04', value: 4 },
    { descricao: '05 a 04 / 05', value: 5 },
    { descricao: '06 a 05 / 06', value: 6 },
    { descricao: '07 a 06 / 07', value: 7 },
    { descricao: '08 a 07 / 08', value: 8 },
    { descricao: '09 a 08 / 09', value: 9 },
    { descricao: '10 a 09 / 10', value: 10 },
    { descricao: '11 a 10 / 11', value: 11 },
    { descricao: '12 a 11 / 12', value: 12 },
    { descricao: '12 a 11 / 13', value: 13 },
    { descricao: '14 a 13 / 14', value: 14 },
    { descricao: '15 a 14 / 15', value: 15 },
    { descricao: '16 a 15 / 16', value: 16 },
    { descricao: '17 a 16 / 17', value: 17 },
    { descricao: '18 a 17 / 18', value: 18 },
    { descricao: '19 a 18 / 19', value: 19 },
    { descricao: '20 a 19 / 20', value: 20 },
    { descricao: '21 a 20 / 21', value: 21 },
    { descricao: '22 a 21 / 22', value: 22 },
    { descricao: '23 a 22 / 23', value: 23 },
    { descricao: '24 a 23 / 24', value: 24 },
    { descricao: '25 a 24 / 25', value: 25 },
    { descricao: '26 a 25 / 26', value: 26 },
    { descricao: '27 a 26 / 27', value: 27 },
    { descricao: '28 a 27 / 28', value: 28 },
    { descricao: '28 a 27 / 29', value: 29 },
    { descricao: '28 a 27 / 30', value: 30 },
    { descricao: '28 a 27 / 31', value: 31 },
  ];

  today: Date = new Date();
  // Cálculo proporcional do boleto
  calculateProportionalBoleto(
    contractLiquidPrice: number,
    newBillingDay: number,
    oldBillingDay: number
  ): number {
    const daysInMonth = 30;

    // Valor diário proporcional
    const dailyPrice = contractLiquidPrice / daysInMonth; //valor de cada dia

    // Calcula diferença de dias
    let daysDifference = newBillingDay - oldBillingDay;
    if (daysDifference < 0) {
      daysDifference += daysInMonth; // Usa o total real de dias do mês
    }

    daysDifference += 1;

    return Number((dailyPrice * daysDifference).toFixed(2));
  }

  // Atualiza o valor proporcional quando o usuário muda a data
  onBillingCycleChange(): void {
    if (this.selectedBillingCycle && this.contract) {
      this.proportionalBoleto = this.calculateProportionalBoleto(
        this.contract.liquidPrice!,
        this.selectedBillingCycle,
        this.contract.cicleBillingExpired!
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
      proportionalValue: this.proportionalBoleto ?? 0,
      newDateExpired:
        this.typesOfDateExpirationCicle.find(
          (t) => t.value === this.selectedBillingCycle
        )?.descricao || '',
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
          // mostra exatamente o que o backend retornou
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

  activeStep = 1;

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber;

    if (stepNumber === 3 && !this.safePdfPreviewUrl) {
      this.loadPdfPreview();
    }
  }

  //Carrega o preview do pdf
  loadPdfPreview(): void {
    if (this.isLoadingPreview) return;

    if (!this.selectedBillingCycle) {
      this.showError(
        'Error',
        'Nenhum plano foi selecionado no passo anterior.'
      );
      this.previewLoadFailed = true;
    }

    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }
    const selected = this.typesOfDateExpirationCicle.find(
      (t) => t.value === this.selectedBillingCycle
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
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.showError(
            'Erro no Preview',
            'não foi possível carregar o termo. tente novamente.'
          );
          this.isLoadingPreview = false;
        },
      });
  }

  //Metodos de captura da assinatura
  abrirAssinatura(): void {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true;
  }

  forceSignatureRedraw() {
    setTimeout(() => {
      this.signatureVisibleFlag = false;
      setTimeout(() => {
        this.signatureVisibleFlag = true;
      });
    }, 30);
  }

  resetSignaturePad() {
    this.capturedSignature = null;
  }

  generateConsentTermWithSignature() {
    if (!this.capturedSignature) {
      this.showError(
        'Atenção',
        'capture a assinatura antes de gerar o termo. '
      );
      return;
    }
    if (this.isLoadingPreview) return;

    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const rawBase64 = this.capturedSignature.split(',')[1];

    const selected = this.typesOfDateExpirationCicle.find(
      (t) => t.value === this.selectedBillingCycle
    );

    if (!selected) return;

    if (!this.selectedTypeOfPaymentMethod) {
      this.showError(
        'Atenção',
        'Selecione um método de pagamento para continuar.'
      );
      return;
    }

    const requestBody: ConsentTermRequestHandle = {
      proportionalValue: this.proportionalBoleto || 0,
      newDateExpired: selected.descricao,
      paymentMethod: this.selectedTypeOfPaymentMethod,
      signature: rawBase64,
    };

    this.reportsService
      .getConsentTermPdf(this.clientId, this.contractId, requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.showSuccess('Sucesso', 'Termo com asinatura gerado!');
          this.signDialogVisible = false;
          this.signedPdfBlob = blob;
          this.isLoadingPreview = false;
        },
        error: (err) => {
          console.error('Erro ao gerar termo com assinatura: ', err);
          this.showError(
            'Erro',
            'Falha ao gerar o termo final com assinatura.'
          );
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        },
      });
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(['info', this.clientId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  captureAndGenerate(): void {
    if (this.isLoadingPreview) return;

    const signatureBase64 = this.signaturePadInDialog.getSignatureAsBase64();

    if (!signatureBase64 || signatureBase64.length <= 22) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não foi possível capturar a assinatura. tente novamente.',
      });
      return;
    }

    this.capturedSignature = signatureBase64;
    this.generateConsentTermWithSignature();
  }

  savePdf(): void {
    if (!this.pdfPreviewUrl) return;
    const a = document.createElement('a');
    a.href = this.pdfPreviewUrl;
    a.download = `Termo_alteracao_data_${
      this.contract.codeContractRbx || this.contractId
    }.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
    this.isPreviewDialogVisible = false;
  }

  async onFotoCapturada(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    if (!file.type.startsWith('image/')) {
      return;
    }

    try {
      const resizedFile = await this.imageUtilsService.resizeImage(
        file,
        1280,
        1280,
        0.7
      );

      this.fotoCapturadaFile = resizedFile;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result ?? null;
        this.isPreviewDialogVisible = true;
      };

      reader.readAsDataURL(resizedFile);
    } catch (error) {
      console.error('Erro ao redimensionar imagem', error);
    }
  }

  salvarFotoCapturada() {
    if (!this.fotoCapturadaFile) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Nenhuma foto',
        detail: 'Tire uma foto antes de salvar.',
      });
      return;
    }

    if (!this.clientId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID do cliente não encontrado para associar a foto.',
      });
      return;
    }

    const filesToUpload: File[] = [this.fotoCapturadaFile];
    this.midiaService.saveMidias(filesToUpload, this.clientId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Foto salva com sucesso!',
        });
        this.limparPreview();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro ao salvar a foto',
        });
        console.error(err);
      },
    });
  }

  blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }


  async submitAlterDate() {
    console.log('Iniciando submit (fluxo Presencial assinado)');

    if (!this.selectedTypeOfPaymentMethod) {
      this.showError(
        'Atenção',
        'Selecione um método de pagamento para continuar.'
      );
      return;
    }
    if (!this.selectedBillingCycle) {
      this.showError('Atenção', 'Selecione uma data de faturamento.');
      return;
    }
    if (!this.signedPdfBlob) {
      this.showError(
        'Atenção',
        'Você precisa gerar o termo assinado antes de atualizar o contrato.'
      );
      return;
    }

    this.isLoadingTransfer = true;
    this.loadingMessage =
      'Atualizando data de vencimento e registrando atendimento...';

    try {
      const pdfDataUrl = await this.blobToBase64(this.signedPdfBlob);

      const pdfBase64Clean = pdfDataUrl.includes(',')
        ? pdfDataUrl.split(',')[1]
        : pdfDataUrl;

      const payload: RequestDateTransfer = {
        clientId: this.clientId,
        contrato: this.contract.codeContractRbx,
        proportionalValue: this.proportionalBoleto ?? 0,
        newDate:
          this.typesOfDateExpirationCicle.find(
            (t) => t.value === this.selectedBillingCycle
          )?.descricao || '',
        paymentMethod: this.selectedTypeOfPaymentMethod,
        fluxo: this.fluxo,
        assunto:
          'Mudança da data de vencimento do cliente:' +
          this.client.name +
          ' Nº Contrato:' +
          this.contract.codeContractRbx,
        phone: this.phone || '',
        pdfBytes: pdfBase64Clean,
      };
      const pdfParaRegistro: Blob = this.signedPdfBlob;

      this.signedPdfBlob = null;

      this.contractService.completeDateTransfer(payload).subscribe({
        next: (response) => {
          console.log('Resposta da API:', response);
          this.result = response;
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Data de vencimento alterada com sucesso!`,
            life: 10000,
          });

          this.tocarCheck = true;
          setTimeout(() => (this.tocarCheck = false), 10);
          this.isLoadingTransfer = false;
          this.modalVisible = false;

          this.finalization = true;
        },
        error: (err) => {
          this.isLoadingTransfer = false;
          console.error('Erro ao alterar data de vencimento:', err);

          const backendMessage =
            typeof err.error === 'string'
              ? err.error
              : err.error?.message || 'Erro ao alterar a data de vencimento.';

          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: backendMessage,
            life: 10000,
          });
        },
      });
    } catch (err) {
      console.error(
        'Erro no processamento do PDF ou montagem do payload:',
        err
      );
      this.isLoadingTransfer = false;
      this.showError(
        'Erro',
        'Falha ao preparar o arquivo para envio. Tente novamente.'
      );
    }
  }

  openPhoneModal() {
    this.phone = '';
    this.showPhoneDialog = true;
  }

  confirmSendToClient() {
    this.showPhoneDialog = false;
    this.submitAlterDate();
  }

  formatCpfCnpj(value: string): string {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF → 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    // CNPJ → 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }

  getDescricaoNovaData(id: any): string {
    const value = Number(id);
    if (isNaN(value)) return '';

    const item = this.typesOfDateExpirationCicle.find((x) => x.value === value);
    return item ? item.descricao : '';
  }

  getBoletoUrl(numero: string | number): string {
    return `${numero}`;
  }
}
