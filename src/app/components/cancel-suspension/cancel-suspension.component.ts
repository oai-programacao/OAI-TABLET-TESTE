import { ImageUtilsService } from './../../services/midia/image-utils.service';
import { Component, inject, ViewChild } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ActivatedRoute, Router } from '@angular/router';
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { Cliente } from '../../models/cliente/cliente.dto';
import { ButtonModule } from 'primeng/button';
import {
  Contract,
} from '../../models/contract/contract.dto';
import { StepperModule } from 'primeng/stepper';
import { ContractSuspenseDTO } from '../../models/contract/contractSuspense.dto';
import { ContractsService } from '../../services/contracts/contracts.service';
import { CommonModule, CurrencyPipe, DatePipe, NgIf } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DialogModule } from 'primeng/dialog';
import { IftaLabelModule } from 'primeng/iftalabel';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import {
  CancelSuspenseContractRequest,
  ReportsService,
} from '../../services/reports/reports.service';
import { TableModule } from 'primeng/table';
import { AttendancesService } from '../../services/attendances/attendance.service';
import { ClientService } from '../../services/clients/client.service';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { AuthService } from '../../core/auth.service';
import { ActionsContractsService } from '../../services/actionsToContract/actions-contracts.service';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-cancel-suspension',
  imports: [
    CardBaseComponent,
    ButtonModule,
    StepperModule,
    DatePipe,
    CurrencyPipe,
    NgIf,
    DialogModule,
    IftaLabelModule,
    SignaturePadComponent,
    DividerModule,
    ProgressSpinnerModule,
    TableModule,
    CommonModule,
    FormsModule,
    InputGroupModule,
    InputGroupAddonModule
],
  templateUrl: './cancel-suspension.component.html',
  providers: [MessageService],
  styleUrl: './cancel-suspension.component.scss',
})
export class CancelSuspensionComponent {
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly messageService = inject(MessageService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly reportsService = inject(ReportsService);
  private readonly attendancesService = inject(AttendancesService);
  private readonly authService = inject(AuthService);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly imageUtilsService = inject(ImageUtilsService);

  private clienteService = inject(ClientService);

  public activeStep: number = 1;
  public pdfBlobFinal: Blob | null = null;
  public currentContract!: Contract;

  contract!: Contract;
  client!: Cliente;
  contractSuspense!: ContractSuspenseDTO;
  clientId!: string;
  contractId!: string;
  modalVisible: boolean = false;

  isLoadingPreview = false;
  previewLoadFailed = false;
  safePdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewUrl: string | null = null;

  signDialogVisible = false;
  capturedSignature!: string | null;
  signatureVisibleFlag = false;
  startSuspension!: string;

  isPreviewDialogVisible: boolean = false;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;

  isSubmitting: boolean = false;
  finalization: boolean = false;
  pdfWasDownloaded: boolean = false;
  isSubmiting: boolean = false;
  result: any = null;

  proportionalBoleto: number = 0;
  proportionalBoletoBefore: number = 0;

  phone: string = '';
  showPhoneDialog: boolean = false;

  ngOnInit(): void {
    const contractId = this.route.snapshot.paramMap.get('contractId');
    console.log('ID recebido da rota:', contractId);
    this.route.params.subscribe((params) => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];
    });
    if (!contractId) {
      console.error('Nenhum suspenseId encontrado na rota!');
      return;
    }

    this.contractId = contractId;

    this.loadContract(contractId);
    this.loadContractSuspense(contractId);
  }

  loadContractSuspense(id: string) {
    this.contractService.getContractSuspenseById(id).subscribe({
      next: (res) => {
        console.log('Suspensão carregada => ', res);
        this.contractSuspense = res;
        this.startSuspension = res.startDate;
        this.updateProportionalValue();
        console.log('carregou nada ' + this.updateProportionalValue);
      },
      error: (err) => {
        console.error('Erro ao carregar suspensão => ', err);
      },
    });
  }

  loadContract(id: string) {
    this.contractService.getContractById(id).subscribe({
      next: (c) => {
        console.log('Contrato carregado:', c);
        this.contract = c;
        this.clientId = c.clientId;
        this.currentContract = c;
        this.clienteService.getClientById(this.clientId!).subscribe((c) => {
          this.client = c;
        });
        console.log(
          'Valor de liquidPrice APÓS carregar:',
          this.contract.liquidPrice
        );

        this.updateProportionalValue();
        this.calculateProportionalBefore();
      },
      error: () => {
        console.error('Erro ao carregar contrato');
      },
    });
  }

  updateProportionalValue(): number {
    if (this.contractSuspense && this.contract) {
      this.proportionalBoleto = this.calculateProportionalValue();
      return this.proportionalBoleto;
    }
    return 0;
  }

  calculateDuration(start: string, finish: string): number {
    const startDate = new Date(start);
    const finishDate = new Date(finish);
    const diff = finishDate.getTime() - startDate.getTime();
    return Math.ceil(diff / 86400000);
  }

  calculateProportionalValue(): number {
    if (
      !this.contractSuspense?.startDate ||
      !this.contract?.cicleBillingExpired
    ) {
      console.error('Dados de contrato/suspensão incompletos para o cálculo.');
      return 0;
    }

    const liquidPrice = this.contract.liquidPrice ?? 0;
    const cycleExpirationDay = Number(this.contract.cicleBillingExpired);

    if (
      isNaN(cycleExpirationDay) ||
      cycleExpirationDay < 1 ||
      cycleExpirationDay > 31
    ) {
      console.error(
        `Dia de expiração do ciclo inválido: ${this.contract.cicleBillingExpired}.`
      );
      return 0;
    }

    const suspensionStartDate = new Date(
      this.contractSuspense.startDate + 'T00:00:00'
    );

    let cycleEndDate = new Date(
      suspensionStartDate.getFullYear(),
      suspensionStartDate.getMonth(),
      cycleExpirationDay,
      0,
      0,
      0
    );

    if (cycleEndDate.getTime() <= suspensionStartDate.getTime()) {
      cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
    }

    const diffMs = cycleEndDate.getTime() - suspensionStartDate.getTime();
    const remainingDays = Math.ceil(diffMs / 86400000);

    console.log(
      `Dias restantes (suspensão em ${suspensionStartDate.toLocaleDateString()} até ${cycleEndDate.toLocaleDateString()}): ${remainingDays}`
    );

    if (remainingDays <= 0) {
      console.log('Dias restantes <= 0. Valor Proporcional: 0.');
      return 0;
    }

    const totalCycleDays = 30;
    const dailyValue = liquidPrice / totalCycleDays;

    console.log(
      `Preço Líquido: ${liquidPrice} | Valor Diário: ${dailyValue.toFixed(2)}`
    );

    const proportionalValue = Number((remainingDays * dailyValue).toFixed(2));

    console.log('Valor Proporcional CALCULADO: ' + proportionalValue);

    return proportionalValue;
  }

  calculateProportionalBefore() {
    const liquidPrice = this.contract?.liquidPrice ?? 0;
    const proportional = this.proportionalBoleto ?? 0;
    this.proportionalBoletoBefore = liquidPrice - proportional;

    return this.proportionalBoletoBefore;
  }

  navigateToListContracts() {
    this.router.navigate(['client-contracts', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['/search']);
  }

  abrirModal() {
    this.modalVisible = true;
  }

  onHide(): void {
    this.modalVisible = false;
    this.phone = '';
  }

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber;

    if (stepNumber === 3 && !this.safePdfPreviewUrl) {
      this.loadPdfPreview();
    }
  }

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

  resetSignaturePad() {
    this.capturedSignature = null;
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

  loadPdfPreview(): void {
    if (this.isLoadingPreview) return;

    console.log('Aguarde enquanto o pdf é gerado...');

    const MINIMUM_SPINNER_TIME = 700;

    this.previewLoadFailed = true;
    const startTime = Date.now();

    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    this.limparPreview();

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const formatDateToDDMMYYYY = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    };

    const requestBody: CancelSuspenseContractRequest = {
      contractId: this.contractId,
      startSuspension: formatDateToDDMMYYYY(this.startSuspension),
      proportional: this.proportionalBoleto,
      signatureBase64: this.capturedSignature ?? null,
    };

    this.reportsService
      .getConsentTermCancelSuspensionContractPdf(requestBody)
      .subscribe({
        next: (blob) => {
          console.log('📥 RESPONSE RECEBIDA DO BACKEND!');
          console.log('📄 Blob recebido:', blob);

          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);

          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          console.log('RequestBody enviado:', requestBody);

          setTimeout(() => {
            this.isLoadingPreview = false;
          }, delay);
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro no Preview',
            detail: 'Não foi possível carregar o termo. Tente novamente.',
          });
          this.previewLoadFailed = true;

          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          setTimeout(() => {
            this.isLoadingPreview = false;
          }, delay);
        },
      });
  }

  generateConsentTermWithSignature(): void {
    if (!this.capturedSignature) {
      alert('Capture a assinatura antes de gerar o termo.');
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

    const formatDateToDDMMYYYY = (date: Date | string): string => {
      const d = new Date(date);
      return d.toLocaleDateString('pt-BR');
    };

    const requestBody: CancelSuspenseContractRequest = {
      contractId: this.contractId,
      startSuspension: formatDateToDDMMYYYY(this.startSuspension),
      proportional: this.proportionalBoleto,
      signatureBase64: this.capturedSignature,
    };

    this.reportsService
      .getConsentTermCancelSuspensionContractPdf(requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfBlobFinal = blob;
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);

          this.isLoadingPreview = false;

          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Termo assinado gerado!',
          });

          this.signDialogVisible = false;
        },
        error: (err) => {
          console.error('Erro ao gerar termo assinado: ', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao gerar o termo final',
          });
          this.previewLoadFailed = true;
          this.isLoadingPreview = true;
        },
      });
  }

  async confirmSuspension() {
    if (!this.pdfBlobFinal) {
      return this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Gere o termo com assinatura antes de confirmar.',
      });
    }

    this.isSubmitting = true;

    let pdfBase64: string;
    try {
      pdfBase64 = await this.blobToBase64(this.pdfBlobFinal);
    } catch (err) {
      this.isSubmitting = false;
      return this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao converter PDF.',
      });
    }

    let pdfBytes;
    try {
      pdfBytes = Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    } catch (err) {
      this.isSubmiting = false;
      return;
    }

    const payload = {
      startSuspension: this.formatDate(this.contractSuspense?.startDate),
      proportional: this.proportionalBoleto,
      pdfBytes: pdfBytes,
      phone: this.phone
    };

    console.log('Aqui é o DTO: ', payload);

    this.contractService
      .cancelSuspendContract(this.contractId, payload)
      .subscribe({
        next: (response: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Suspensão registrada!',
          });
          this.result = {
            clientName:
              this.client?.name ||
              this.client?.socialName ||
              'Cliente Indisponível',
            clientCpf: this.formatCpfCnpj(
              this.client?.cpf || this.client?.cnpj || 'N/A'
            ),
            contrato:
              this.currentContract?.codeContractRbx || this.currentContract?.id,
            proportionalRemainder: this.calculateProportionalRemainder(),
            linkBoleto: response?.linkBoleto,
          };

          console.log('Carrega o result', this.result);

          this.isSubmitting = false;
          this.finalization = true;
        },
        error: () => {
          this.isSubmitting = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao registrar suspensão.',
          });
        },
        complete: () => {
          this.isSubmiting = false;
        },
      });
  }

  event: string = 'temporary-suspension';
  private registerAttendance(pdfBlob: Blob, linkBoleto: string): void {
    if (!this.clientId || !this.contractId) {
      console.error(
        'registerAttendance: ClientID ou ContractID estão ausentes.'
      );
      return;
    }
    const data = {
      event: this.event as string,
      cliente: this.clientId,
      contrato: this.contractId,
      linkBoleto: linkBoleto,
    };

    const jsonBlob = new Blob([JSON.stringify(data)], {
      type: 'application/json',
    });

    const formData = new FormData();
    formData.append('data', jsonBlob, 'data.json');
    formData.append(
      'arquivo',
      pdfBlob,
      'termo_cancelamento_suspensao_assinado.pdf'
    );

    this.attendancesService.registerAttendance(formData).subscribe({
      next: (response) => {
        console.log('Atendimento registrado com sucesso:', response);
        this.showInfo(
          'Registro de Atendimento',
          'Atendimento registrado com sucesso no sistema.'
        );
      },
      error: (err) => {
        console.error('Falha ao registrar atendimento:', err);
        this.showWarning(
          'Aviso',
          'A transferência foi concluída, mas houve um erro ao registrar o atendimento no histórico.'
        );
      },
    });
  }

  openPhoneModal() {
    this.phone = '';
    this.showPhoneDialog = true;
  }

  confirmSendToClient() {
    this.showPhoneDialog = false;
    this.confirmSuspension();
  }

  private showWarning(summary: string, detail: string, life?: number): void {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  private showInfo(summary: string, detail: string, life: number = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(['info', this.clientId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;

    this.isPreviewDialogVisible = false;
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  formatCpfCnpj(value: string | null | undefined): string {
    if (!value) return ''; // ⛔ impede erro de .replace()

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

  formatDate(date: Date | string | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString().split('T')[0];
  }

  calculateProportionalRemainder(): number {
    const proportionalPaid = this.proportionalBoleto;
    return proportionalPaid;
  }

  sendToAutentiqueSubmitCancel() {
    const rawPhone = (this.phone || '').replace(/\D/g, '');
    const phone = rawPhone.startsWith('55') ? `+${rawPhone}` : `+55${rawPhone}`;

    const mappedSigners = [
      {
        name: this.client.name || '',
        phone,
      },
    ];
    const sellerId = this.authService.getSellerId();
    if (sellerId === null || sellerId === undefined) {
      console.error(
        'ERRO CRÍTICO: SellerID está nulo ou indefinido. Verifique o AuthService.'
      );
      this.messageService.add({
        severity: 'error',
        summary: 'Erro de Autenticação',
        detail: 'ID do Vendedor não foi encontrado.',
      });
      return;
    }
    const sellerIdString = String(sellerId);

    const payload = {
      signers: mappedSigners,
      clientId: this.clientId,
      contractId: this.contractId,
      sellerId: sellerIdString,
      proportional: this.calculateProportionalRemainder(),
      startSuspension: this.startSuspension,
    };

    this.actionsContractsService
      .sendCancelSuspensionAutentique(payload, this.clientId, this.contractId)
      .subscribe({
        next: (res: string) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso!',
            detail: `${res}.
        Aguarde o cliente assinar, todo o processo será feito de forma automática.
            Consulte nos atendimentos do cliente se foi feito de fato.`,
            life: 10000,
          });
          this.modalVisible = false;
        },
        error: (err) => {
          const backendMessage =
            (typeof err.error === 'string' ? err.error : err?.error?.message) ||
            'Erro ao tentar enviar para o número, verifique com o Suporte!';
          if (backendMessage.includes('Aguarde 4 minutos antes')) {
            this.messageService.add({
              severity: 'error',
              summary: 'Atenção',
              detail: backendMessage,
            });
          }
        },
      });
  }
}

function formatDateToDDMMYYYY(startSuspension: string) {
  throw new Error('Function not implemented.');
}
