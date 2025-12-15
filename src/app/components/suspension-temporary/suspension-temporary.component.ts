import { Component, inject, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ButtonModule } from "primeng/button";
import { Contract } from '../../models/contract/contract.dto';
import { ContractsService } from '../../services/contracts/contracts.service';
import { ClientService } from '../../services/clients/client.service';
import { MessageService } from 'primeng/api';
import { Cliente } from '../../models/cliente/cliente.dto';
import { DialogModule } from "primeng/dialog";
import { CalendarModule } from "primeng/calendar";
import { DropdownModule } from "primeng/dropdown";
import { FormsModule } from '@angular/forms';
import { Knob } from 'primeng/knob';
import { CheckComponent } from "../../shared/components/check-component/check-component.component";
import { ToastModule } from "primeng/toast";
import { StepperModule } from "primeng/stepper";
import { CommonModule } from '@angular/common';
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ContractSuspenseRequest, ReportsService } from '../../services/reports/reports.service';
import { DatePicker, DatePickerModule } from "primeng/datepicker";
import { IftaLabelModule } from "primeng/iftalabel";
import { SignaturePadComponent } from "../../shared/components/signature-pad/signature-pad.component";
import { DividerModule } from "primeng/divider";
import { TableModule } from "primeng/table";
import { Client } from '@stomp/stompjs';
import { AttendancesService } from '../../services/attendances/attendance.service';

@Component({
  selector: 'app-suspension-temporary',
  imports: [
    CardBaseComponent,
    ButtonModule,
    DialogModule,
    CalendarModule,
    DropdownModule,
    FormsModule,
    Knob,
    CheckComponent,
    ToastModule,
    StepperModule,
    CommonModule,
    InputGroupModule,
    InputGroupAddonModule,
    ProgressSpinnerModule,
    DatePickerModule,
    IftaLabelModule,
    SignaturePadComponent,
    DividerModule,
    TableModule
  ],
  providers: [MessageService],
  templateUrl: './suspension-temporary.component.html',
  styleUrl: './suspension-temporary.component.scss'
})
export class SuspensionTemporaryComponent {
  @ViewChild('signaturePadInDialog')
  signaturePadInDialog!: SignaturePadComponent;

  private readonly router = inject(Router);
  private readonly reportsService = inject(ReportsService);
  private readonly attendancesService = inject(AttendancesService);

  private contractService = inject(ContractsService);
  private clienteService = inject(ClientService);
  private messageService = inject(MessageService);

  public activeStep: number = 1;
  public pdfPreviewUrl: string | null = null;
  public pdfBlobFinal: Blob | null = null;

  contract: Contract = {} as Contract;

  client: Cliente = {} as Cliente;
  clientId: string | null = null;
  contractId!: string;
  phone: string = '';
  openSuspender: boolean = false;
  openCancelSuspender: boolean = false;
  isPreviewDialogVisible: boolean = false;
  tocarCheck: boolean = false;
  modalVisible: boolean = false;
  formIsValid: boolean = true;
  avisoInvalido: boolean = false;

  safePdfPreviewUrl: SafeResourceUrl | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;

  capturedSignature!: string | null;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;

  pdfWasDownloaded: boolean = false;
  signDialogVisible: boolean = false;
  signatureVisibleFlag: boolean = false;
  proportionalBoleto: number | null = null;
  startDate: Date | undefined;
  finishDate: string = '';
  duration!: number;

  isSubmiting: boolean = false;
  finalization: boolean = false;
  result: any = null;
  blockButton: boolean = false;

  constructor(private route: ActivatedRoute, private sanitizer: DomSanitizer) { }

  calculateProportionalBoleto(
    contractLiquidPrice: number,
    newBillingDay: number,
    oldBillingDay: number
  ): number {
    const daysInMonth = 30;

    const dailyPrice = contractLiquidPrice / daysInMonth;

    let daysDifference = newBillingDay - oldBillingDay;
    if (daysDifference < 0) {
      daysDifference += daysInMonth;
    }

    daysDifference += 1;

    return Number((dailyPrice * daysDifference).toFixed(2));
  }

  abrirModal(): void {
    this.modalVisible = true;
  }

  abrirAssinatura() {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true;
  }

  savePdf() {
    if (!this.pdfPreviewUrl) {
      console.error('URL do PDF não disponível para salvar.');
      return;
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS) {
      window.open(this.pdfPreviewUrl, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = this.pdfPreviewUrl;
      link.download = 'termo_de_consentimento.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.pdfWasDownloaded = true;
    }
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

  captureAndGenerate(): void {
    if (this.isLoadingPreview) return;

    const signatureBase64 = this.signaturePadInDialog.getSignatureAsBase64();

    if (!signatureBase64) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Por favor, assine no campo antes de gerar o termo.',
      });
      return;
    }

    this.capturedSignature = signatureBase64;
    this.generateConsentTermWithSignature();
  }

  onValuesChange() {
    const selectedDate = this.suspensionData.dateInitialSuspension;

    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateToCheck = new Date(selectedDate);
      dateToCheck.setHours(0, 0, 0, 0);
      if (dateToCheck < today) {
        this.showErrorToast('A data de suspensão não pode ser menor que o dia de hoje.');
        this.suspensionData.dateInitialSuspension = null;
        this.blockButton = true;
        return; // <-- ESSENCIAL: Interrompe a execução da função
      }
    }
    this.startDate = this.suspensionData.dateInitialSuspension!;
    this.duration = this.suspensionData.duration;
    this.blockButton = false;
    console.log("   - startDate =", this.startDate);
    console.log("   - duration =", this.duration);

    if (!this.startDate || !this.duration) {
      return;
    }

    this.calculateFinishDate();

    this.proportionalBoleto = this.calculateProportional(
      this.contract.liquidPrice!,
      this.contract.cicleBillingExpired!,
      this.startDate
    );
    console.log("   - proportionalBoleto =", this.proportionalBoleto);
  }

  onFotoCapturada(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.fotoCapturadaFile = file;
      const reader = new FileReader();

      reader.onload = (e) => {
        this.thumbnailPreview = e.target?.result ?? null;

        this.isPreviewDialogVisible = true;
      };

      reader.readAsDataURL(file);
    }
  }

  billingDay: number | null = null;


  calculateFinishDate() {
    const start = new Date(this.startDate!);
    const end = new Date(start);
    end.setDate(start.getDate() + this.duration);

    this.finishDate = end.toISOString().split("T")[0];
  }

  calculateProportional(
    contractLiquidPrice: number,
    billingDay: number,
    suspensionDate: Date
  ): number {

    const dailyPrice = contractLiquidPrice / 30;
    const suspension = new Date(suspensionDate);

    let cycleDate = new Date(
      suspension.getFullYear(),
      suspension.getMonth(),
      billingDay
    );

    if (suspension < cycleDate) {
      cycleDate = new Date(
        suspension.getFullYear(),
        suspension.getMonth() - 1,
        billingDay
      );
    }

    const diffMs = suspension.getTime() - cycleDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    return Number((dailyPrice * diffDays).toFixed(2));
  }

  onHide(): void {
    this.modalVisible = false;
    this.phone = '';
  }

  openDialogSuspender() {
    this.openSuspender = true;
  }

  openDialogCancelSuspender() {
    this.openCancelSuspender = true;
  }

  meuMetodoExtra(): void {
    this.formIsValid = true;
    this.avisoInvalido = false;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];
    })
    console.log('Componente de Suspensão Carregado.');
    console.log(`Cliente ID: ${this.clientId}, Contrato ID: ${this.contractId}`);
    this.loadContract();
  }

  private formatToBackendDate(date: Date): string {
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
  }

  calculateEndDate(): Date {
    if (!this.suspensionData.dateInitialSuspension) return new Date();

    const endDate = new Date(this.suspensionData.dateInitialSuspension);
    endDate.setDate(endDate.getDate() + this.suspensionData.duration);
    return endDate;
  }

  navigateToListContracts() {
    this.router.navigate(['client-contracts', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['/search'])
  }

  loadContract(): void {
    this.contractService.getContractById(this.contractId).subscribe({
      next: (data) => {
        this.contract = data;
        this.clienteService.getClientById(this.clientId!).subscribe(c => {
          this.client = c;
        });
      },
      error: (err) => {
        console.error('Erro ao carregar contrato', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do contrato.' });
      }
    });
  }

  suspensionData: {
    dateInitialSuspension: Date | null;
    duration: number;
  } = {
      dateInitialSuspension: null,
      duration: 30
    };

  durationOptions = [
    { label: '30 dias', value: 30 },
    { label: '60 dias', value: 60 },
    { label: '90 dias', value: 90 },
    { label: '120 dias', value: 120 }
  ];

  onSliderChange() {
    const valid = [30, 60, 90, 120];
    if (!valid.includes(this.suspensionData.duration)) {
      this.suspensionData.duration = valid.reduce((prev, curr) =>
        Math.abs(curr - this.suspensionData.duration) <
          Math.abs(prev - this.suspensionData.duration)
          ? curr
          : prev
      );
    }
  }

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;

    this.isPreviewDialogVisible = false;
  }


  loadPdfPreview(): void {
    console.log("🚀 loadPdfPreview() chamado!");

    if (this.isLoadingPreview) {
      console.warn("⚠️ Já está carregando o preview, cancelado.");
      return;
    }

    console.log("⏳ Iniciando carregamento...");

    const MINIMUM_SPINNER_TIME = 700;

    this.isLoadingPreview = true;
    const startTime = Date.now();

    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    console.log("DEBUG → Dados atuais:");
    console.log("dateInitialSuspension:", this.suspensionData.dateInitialSuspension);
    console.log("duration:", this.suspensionData.duration);
    console.log("capturedSignature:", this.capturedSignature);

    // 🧨 PROBLEMA MAIS COMUM: esse return silencioso aqui.
    if (!this.suspensionData.dateInitialSuspension) {
      console.warn("ERRO: falta data");
      return;
    }

    this.limparPreview();
    console.log("✔️ Preview limpo com sucesso");

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
      console.log("♻️ URL antiga revogada");
    }

    // 🔥 MONTANDO O BODY
    const requestBody: ContractSuspenseRequest = {
      contractId: this.contractId,
      startDate: this.formatToBackendDate(this.suspensionData.dateInitialSuspension),
      duration: this.suspensionData.duration,
      signatureBase64: this.capturedSignature ?? null,
    };

    console.log("📦 RequestBody montado:", requestBody);

    // 🔥 VALIDANDO OS CAMPOS QUE O BACKEND EXIGE
    if (!requestBody.startDate) console.error("❌ ERRO: startDate enviado está vazio!");
    if (!requestBody.duration) console.warn("⚠️ ATENÇÃO: duration está vazio, backend aceita?");

    console.log("🌐 Chamando rota de PREVIEW do PDF...");

    this.reportsService
      .getConsentTermSuspensionContractPdf(requestBody)
      .subscribe({
        next: (blob) => {
          console.log("📥 RESPONSE RECEBIDA DO BACKEND!");
          console.log("📄 Blob recebido:", blob);

          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl =
            this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);

          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          console.log(`⏱ Aguardando ${delay} ms para encerrar spinner...`);

          setTimeout(() => {
            this.isLoadingPreview = false;
            console.log("✅ Preview finalizado e renderizado no iframe.");
          }, delay);
        },
        error: (err) => {
          console.error("❌ ERRO AO CARREGAR PDF:", err);
          console.warn("➡️ Verifique se o backend recebeu o payload corretamente.");

          this.previewLoadFailed = true;

          const duration = Date.now() - startTime;
          const delay = Math.max(0, MINIMUM_SPINNER_TIME - duration);

          setTimeout(() => {
            this.isLoadingPreview = false;
          }, delay);
        },
      });
  }

  generateConsentTermWithSignature() {
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

    const requestBody: ContractSuspenseRequest = {
      contractId: this.contractId,
      startDate: this.formatToBackendDate(this.suspensionData.dateInitialSuspension!),
      duration: this.suspensionData.duration,
      signatureBase64: this.capturedSignature,
    };

    this.reportsService
      .getConsentTermSuspensionContractPdf(requestBody)
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
          console.error('Erro ao gerar termo assinado:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Falha ao gerar o termo final.',
          });
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        }
      });
  }

  sendToAutentiqueSubmit() {

  }

  async confirmSuspension() {
    if (!this.suspensionData.dateInitialSuspension) {
      return this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Selecione a data de início da suspensão.'
      });
    }

    if (!this.pdfBlobFinal) {
      return this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Gere o termo com assinatura antes de confirmar.'
      });
    }
    this.isSubmiting = true;

    let pdfBase64: string;
    try {
      pdfBase64 = await this.blobToBase64(this.pdfBlobFinal);
    } catch (err) {
      this.isSubmiting = false;
      return this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Falha ao converter PDF.'
      });
    }

    let pdfBytes;
    try {
      pdfBytes = Array.from(atob(pdfBase64), c => c.charCodeAt(0));
    } catch (err) {
      this.isSubmiting = false;
      return;
    }

    const dto = {
      dateInitialSuspension: this.suspensionData.dateInitialSuspension.toISOString().split("T")[0],
      dateFinishSuspension: this.finishDate,
      duration: this.suspensionData.duration,
      proporcional: this.proportionalBoleto,
      pdfBytes: pdfBytes
    };

    this.contractService.suspendContract(this.contractId, dto).subscribe({
      next: (res: any) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Suspensão temporária agendada com sucesso!'
        });
        if (this.pdfBlobFinal) {
          this.registerAttendance(this.pdfBlobFinal, res.linkBoleto);
        } else {
          console.warn("PDF não encontrado, o atendimento não será registrado.");
        }

        this.result = {
          clientName: this.client?.name || this.client?.socialName || 'Cliente Indisponível',
          clientCpf: this.formatCpfCnpj(this.client?.cpf || this.client?.cnpj || 'N/A'),
          contrato: this.contract?.codeContractRbx || this.contract?.id,
          proporcional: this.proportionalBoleto,
          linkBoleto: res?.linkBoleto
        }
        this.openSuspender = false;
        this.tocarCheck = true;
        this.loadContract();
        this.finalization = true;
      },
      error: (err) => {
        this.isSubmiting = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao agendar suspensão.'
        });
      },
      complete: () => {
        this.isSubmiting = false;
      }
    });
  }

  event: string = "temporary-suspension";
  private registerAttendance(pdfBlob: Blob, linkBoleto: string): void {
    if (!this.clientId || !this.contractId) {
      console.error("registerAttendance: ClientID ou ContractID estão ausentes.");
      return;
    }
    const data = {
      event: this.event as string,
      cliente: this.clientId,
      contrato: this.contractId,
      linkBoleto: linkBoleto
    };

    const jsonBlob = new Blob([JSON.stringify(data)], { type: "application/json" });

    const formData = new FormData();
    formData.append('data', jsonBlob, 'data.json');
    formData.append('arquivo', pdfBlob, 'termo_transferencia_assinado.pdf');

    this.attendancesService.registerAttendance(formData).subscribe({
      next: (response) => {
        console.log("Atendimento registrado com sucesso:", response);
        this.showInfo("Registro de Atendimento", "Atendimento registrado com sucesso no sistema.");
      },
      error: (err) => {
        console.error("Falha ao registrar atendimento:", err);
        this.showWarning("Aviso", "A transferência foi concluída, mas houve um erro ao registrar o atendimento no histórico.");
      }
    });
  }

  private showWarning(summary: string, detail: string, life?: number): void {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  private showInfo(summary: string, detail: string, life: number = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(["info", this.clientId])
    } else {
      this.router.navigate(["/"])
    }
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

  showErrorToast(message: string): void {
    this.messageService.add({
      severity: 'error',
      summary: 'Erro de Validação',
      detail: message,
      life: 5000
    });
  }
}
