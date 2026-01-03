import { SignaturePadComponent } from './../../shared/components/signature-pad/signature-pad.component';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastModule } from "primeng/toast";
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ButtonModule } from "primeng/button";
import { ActivatedRoute, Router } from '@angular/router';
import { StepperModule } from "primeng/stepper";

import { Contract } from '../../models/contract/contract.dto';
import { CommonModule } from '@angular/common';
import { MessageService } from 'primeng/api';
import { Plan as ServicePlan, PlanService } from '../../services/plan/plan.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ClientService } from '../../services/clients/client.service';
import { Cliente } from '../../models/cliente/cliente.dto';
import { SelectModule } from 'primeng/select';
import { DialogModule } from "primeng/dialog";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from "primeng/inputtext";
import { InputNumberModule } from 'primeng/inputnumber';
import { ActionsContractsService } from '../../services/actionsToContract/actions-contracts.service';
import { AuthService } from '../../core/auth.service';
import { NgxMaskDirective } from 'ngx-mask';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DividerModule } from 'primeng/divider';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReportsService } from '../../services/reports/reports.service';
import { MidiaService } from '../../services/midia/midia.service';
import { IftaLabelModule } from "primeng/iftalabel";
import { AttendancesService } from '../../services/attendances/attendance.service';
import { TableModule } from "primeng/table";
import { CheckComponent } from '../../shared/components/check-component/check-component.component';

export interface ContractUpdate {
  seller: string;
  codePlan: number;
  descountFixe: number;
  cicleFatId: number;
  cicleBillingDayBase: number;
  cicleBillingExpired: number;
  proportionalValue?: number | null;
  phone?: string | null; 
}

@Component({
  selector: 'app-down-upgrade',
  standalone: true,
  imports: [
    // 🔹 Angular Core
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // 🔹 PrimeNG
    ToastModule,
    ButtonModule,
    StepperModule,
    SelectModule,
    DialogModule,
    InputGroupModule,
    InputGroupAddonModule,
    InputTextModule,
    InputNumberModule,
    CalendarModule,
    CheckboxModule,
    ConfirmDialogModule,
    DividerModule,
    PopoverModule,
    ProgressSpinnerModule,
    TooltipModule,
    // 🔹 Máscara de input
    NgxMaskDirective,
    // 🔹 Componente customizado
    CardBaseComponent,
    SignaturePadComponent,
    IftaLabelModule,
    TableModule,
    CheckComponent
  ],
  providers: [MessageService],
  templateUrl: './down-upgrade.component.html',
  styleUrl: './down-upgrade.component.scss'
})
export class DownUpgradeComponent implements OnInit {
  @ViewChild('cameraInput') cameraInput!: ElementRef<HTMLInputElement>;
  @ViewChild('signaturePadInDialog') signaturePadInDialog!: SignaturePadComponent;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly reportsService = inject(ReportsService);
  private readonly midiaService = inject(MidiaService);

  private planService = inject(PlanService);
  private contractService = inject(ContractsService);
  private clienteService = inject(ClientService);
  private messageService = inject(MessageService);
  private attendancesService = inject(AttendancesService);

  private actionsContractsService = inject(ActionsContractsService);
  private readonly authService = inject(AuthService);
  private signedPdfBlob: Blob | null = null;

  public activeStep: number = 1;

  clientId!: string;
  contractId!: string;
  contract: Contract = {} as Contract;
  client: Cliente = {} as Cliente;

  modalVisible: boolean = false;
  phone: string = '';

  upgradeForm!: FormGroup;

  selectedPlan: ServicePlan | null = null;
  typesofplans: ServicePlan[] = [];

  selectedBillingCycle: number | null = null;
  newDiscount: number | null = null;

  isLoadingTransfer: boolean = false;
  loadingMessage: string = '';

  avisoInvalido: boolean = true;

  safePdfPreviewUrl: SafeResourceUrl | null = null;
  pdfPreviewUrl: string | null = null;
  isLoadingPreview = false;
  previewLoadFailed = false;

  signDialogVisible = false;
  capturedSignature: string | null = null;

  signatureVisibleFlag = false;
  isPreviewDialogVisible: boolean = false;
  thumbnailPreview: string | ArrayBuffer | null = null;
  fotoCapturadaFile: File | null = null;

  tocarCheck = false;
  finalization: boolean = false;
  result: any;

  showPhoneDialog: boolean = false;

  typesOfDateExpirationCicle = [
    { descricao: 'Nenhum', value: null },
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
    { descricao: '13 a 12 / 13', value: 13 },
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
    { descricao: '29 a 28 / 29', value: 29 },
    { descricao: '30 a 29 / 30', value: 30 },
    { descricao: '31 a 30 / 31', value: 31 },
  ];


  fluxo!: boolean | 'upgrade' | 'downgrade';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];
      if (!this.clientId || !this.contractId) return this.backToHome();
      this.loadContractAndClient(this.contractId, this.clientId);
      this.loadPlans();
      this.fluxo = params['action'];
    });

    this.clientId = this.route.snapshot.paramMap.get('clientId')!;
    this.contractId = this.route.snapshot.paramMap.get('contractId')!;

    if (!this.clientId || !this.contractId) {
      this.backToHome();
      return;
    }

    this.loadPlans();
    this.loadContract();
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(["info", this.clientId])
    } else {
      this.router.navigate(["/"])
    }
  }

  loadContractAndClient(contractId: string, clientId: string) {
    forkJoin({
      contract: this.contractService.getContractById(contractId),
      client: this.clienteService.getClientById(clientId),
    }).subscribe({
      next: ({ contract, client }) => {
        this.contract = contract;
        this.client = client;
        if (client.telefone) {
          this.phone = client.telefone.replace(/\D/g, '');
        }
        console.log("Dados do Contrato Carregado:", this.contract);
      },
      error: (err) => {
        console.error('Erro ao carregar contrato ou cliente', err);
      },
    });
  }

  loadPlans(): void {
    this.planService.getPlans().subscribe({
      next: (data) => {
        this.typesofplans = data;
      },
      error: (err) => {
        console.error('Erro ao carregar planos', err);
      }
    });
  }

  public get valorFinalComDescontoDisplay(): number{
    const valorBase = this.selectedPlan?.valor || 0;
    const desconto = this.newDiscount || 0;
    if(!this.selectedPlan) {
      return 0;
    }
    const valorFinal = valorBase - desconto;

    return valorFinal > 0 ? valorFinal : 0;
  }

  loadContract(): void {
    this.contractService.getContractById(this.contractId).subscribe({
      next: (data) => {
        this.contract = data;
        this.selectedBillingCycle = this.contract.cicleBillingExpired;
        if (this.client.telefone) {
          this.phone = this.client.telefone.replace(/\D/g, '');
        }
      },
      error: (err) => {
        console.error('Erro ao carregar contrato', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do contrato.' });
      }
    });
  }

  private showWarning(summary: string, detail: string, life: number = 5000) {
    this.messageService.add({ severity: 'warn', summary, detail, life });
  }

  private showInfo(summary: string, detail: string, life: number = 3000) {
    this.messageService.add({ severity: 'info', summary, detail, life });
  }

  private registerAttendance(pdfBlob: Blob): void {
    if (!this.clientId || !this.contractId) {
      console.error("registerAttendance: ClientID ou ContractID estão ausentes.");
      return;
    }
    const data = {
      event: this.fluxo as string,
      cliente: this.clientId,
      contrato: this.contractId,
      plano: this.selectedPlan!.codePlanRBX
    };

    console.log("Validando se a data está vindo certa: ", data)
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

  submitUpgrade() {
    console.log('Iniciando submitUpgrade (Fluxo Presencial Assinado)');

    if (!this.signedPdfBlob) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Você precisa gerar o termo assinado antes de atualizar o contrato.' });
      return;
    }

    if (!this.selectedPlan || this.newDiscount === null || !this.contract) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um plano e defina um desconto.' });
      return;
    }

    const pdfParaRegistrar: Blob = this.signedPdfBlob;
    this.signedPdfBlob = null;

    const sellerIdNumber = this.authService.getSellerId();
    if (sellerIdNumber === null || sellerIdNumber === undefined) {
      console.error('ERRO CRÍTICO: SellerID está nulo ou indefinido. Verifique o AuthService.');
      this.messageService.add({ severity: 'error', summary: 'Erro de Autenticação', detail: 'ID do Vendedor não foi encontrado.' });
      return;
    }
    const sellerIdString = String(sellerIdNumber);

    if (this.contract.cicleBillingDayBase === null || this.contract.cicleBillingExpired === null) {
      console.error('ERRO CRÍTICO: cicleBillingDayBase ou cicleBillingExpired estão nulos no contrato carregado.');
      this.messageService.add({ severity: 'error', summary: 'Erro de Dados', detail: 'Informações de ciclo de faturamento inválidas no contrato.' });
      return;
    }
    const cicleBillingDayBaseToSend = this.contract.cicleBillingDayBase;
    const cicleBillingExpiredToSend = this.contract.cicleBillingExpired;
    const cicleFatIdParaEnviar = cicleBillingExpiredToSend;

    const upgradeDto: ContractUpdate = {
      seller: sellerIdString,
      codePlan: this.selectedPlan.codePlanRBX,
      descountFixe: this.newDiscount ?? 0,
      cicleFatId: cicleFatIdParaEnviar,
      cicleBillingDayBase: cicleBillingDayBaseToSend,
      cicleBillingExpired: cicleBillingExpiredToSend,
      phone: this.phone = ''
    };

    console.log('Enviando DTO de Upgrade:', upgradeDto);

    this.isLoadingTransfer = true;
    this.loadingMessage = "Atualizando contrato e registrando atendimento...";

    this.contractService.upgradeContract(this.contractId, upgradeDto)
      .subscribe({
        next: (newContractResponse) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Contrato atualizado! O novo contrato é: ${newContractResponse.codeContractRbx}`,
            life: 10000,
          });

          const valorPlano = this.selectedPlan!.valor || 0;
          const desconto = this.newDiscount || 0;
          const valorFinalComDesconto = valorPlano - desconto;
          this.result = {
            clientName: this.client.name, 
            clientCpf: this.client.cpf,   
            contrato: newContractResponse.codeContractRbx,
            plano: this.selectedPlan!.nome,
            valor: valorFinalComDesconto
          };
          this.registerAttendance(pdfParaRegistrar);

          this.tocarCheck = true;
          this.finalization = true;
          this.isLoadingTransfer = false;
          this.modalVisible = false;
        },
        error: (err) => {
          this.isLoadingTransfer = false;
          console.error('Erro ao fazer upgrade do contrato:', err);
          const backendMessage =
            typeof err.error === 'string'
              ? err.error
              : (err.error?.message || 'Erro ao tentar transferir o contrato.');

          this.messageService.add({
            severity: 'error',
            summary: 'Erro na Transferência',
            detail: backendMessage,
            life: 10000,
          });
        },
      });
  }

   openPhoneModal() {
    this.phone = '';
    this.showPhoneDialog = true;
  }

  confirmSendToClient() {
    this.showPhoneDialog = false;
    this.submitUpgrade();
  }


  public get arePhonesInvalid(): boolean {
    const cleanPhoneOld = (this.phone || '').replace(/\D/g, '');
    return cleanPhoneOld.length < 10;
  }

  abrirModal(): void {
    this.modalVisible = true;
    this.phone = '';
  }

  onHide() {
    this.modalVisible = false;
  }

  sendTransferSubmit(): void {
    if (!this.client || !this.client.name) {
      this.showError('Erro de Dados', 'Não foi possível obter os dados completos do titular');
      return;
    }

    const sellerIdNumber = this.authService.getSellerId();
    if (!sellerIdNumber) {
      this.showError('Erro de Autenticação', 'Não foi possível identificar o vendedor logado.');
      return;
    }
    const sellerId: string = sellerIdNumber.toString();

    const payload: any = {
      sellerId: sellerId,
      fluxo: this.fluxo,
      newPlanId: this.selectedPlan?.id,
      signers: [
        {
          name: this.client.name || '',
          phone: '+55' + (this.phone || '').replace(/\D/g, '')
        }
      ]
    };
    console.log('Payload enviado:', payload);

    // 4. Feedback de UI
    this.isLoadingTransfer = true;
    this.loadingMessage = 'A enviar documento para assinatura...';
    this.fecharModalAutentique();

    // 5. Chamada ao NOVO Serviço
    this.actionsContractsService
      .sendUpgradeConsentAutentique(
        payload,
        this.contractId,
        this.clientId
      )
      .subscribe({
        next: (res: string) => {
          this.isLoadingTransfer = false;
          this.showSuccess('Sucesso!', res, 10000);
        },
        error: (err) => {
          this.isLoadingTransfer = false;
          const backendMessage = (typeof err.error === 'string' ? err.error : err?.error?.message) || 'Erro ao tentar enviar. Verifique com o Suporte!';
          this.showError('Erro no Envio', backendMessage);
        },
      });
  }

  fecharModalAutentique(): void {
    this.modalVisible = false;
  }
  private showSuccess(summary: string, detail: string, life: number = 3000) { this.messageService.add({ severity: 'success', summary, detail, life }); }
  private showError(summary: string, detail: string) {
    this.messageService.add({ severity: 'error', summary, detail });
  }

  loadPdfPreview(): void {
    if (this.isLoadingPreview) return;

    if (!this.selectedPlan) {
      this.showError('Erro', 'Nenhum plano foi selecionado no passo anterior.');
      this.previewLoadFailed = true;
      return;
    }

    console.log('Gerando preview do termo de upgrade...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    // 1. Crie o 'body' EXATAMENTE como no Postman
    const requestBody = {
      contractId: this.contract.id,
      newPlanId: this.selectedPlan.id
    };

    // 2. CHAME O SERVIÇO ENVIANDO O 'requestBody'
    this.reportsService.getPlanChange(requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
        },
        error: (err) => {
          console.error('Erro ao carregar preview do PDF:', err);
          this.showError('Erro no Preview', 'Não foi possível carregar o termo. Tente novamente.');
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        },
      });
  }

  abrirAssinatura(): void {
    this.signDialogVisible = true;
    this.signatureVisibleFlag = true; // Força o redesenho
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

    if (!signatureBase64 || signatureBase64.length <= 22) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Não foi possível capturar a assinatura. Tente novamente.',
      });
      return;
    }

    this.capturedSignature = signatureBase64;
    this.generateConsentTermWithSignature();
  }

  generateConsentTermWithSignature() {
    if (!this.capturedSignature) {
      this.showError('Atenção', 'Capture a assinatura antes de gerar o termo.');
      return;
    }
    if (this.isLoadingPreview) return;

    console.log('Gerando termo com assinatura...');
    this.isLoadingPreview = true;
    this.previewLoadFailed = false;
    this.safePdfPreviewUrl = null;

    if (this.pdfPreviewUrl) {
      URL.revokeObjectURL(this.pdfPreviewUrl);
      this.pdfPreviewUrl = null;
    }

    const rawBase64 = this.capturedSignature.split(',')[1];

    const requestBody = {
      contractId: this.contract.id,
      newPlanId: this.selectedPlan!.id,
      signatureBase64: rawBase64
    };

    this.reportsService.getPlanChange(requestBody)
      .subscribe({
        next: (blob) => {
          this.pdfPreviewUrl = window.URL.createObjectURL(blob);
          this.safePdfPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.pdfPreviewUrl);
          this.isLoadingPreview = false;
          this.showSuccess('Sucesso', 'Termo com assinatura gerado!');
          this.signDialogVisible = false;
          this.signedPdfBlob = blob;
        },
        error: (err) => {
          console.error('Erro ao gerar termo com assinatura:', err);
          this.showError('Erro', 'Falha ao gerar o termo final com assinatura.');
          this.previewLoadFailed = true;
          this.isLoadingPreview = false;
        },
      });
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

  limparPreview(): void {
    this.thumbnailPreview = null;
    this.fotoCapturadaFile = null;
    this.isPreviewDialogVisible = false;
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
        this.limparPreview(); // Fecha o dialog de preview
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

  goToStep(stepNumber: number): void {
    this.activeStep = stepNumber;

    if (stepNumber === 3 && !this.safePdfPreviewUrl) {
      this.loadPdfPreview();
    }
  }

  meuMetodoExtra(): void {
    this.avisoInvalido = false;
  }

  savePdf(): void {
    if (!this.pdfPreviewUrl) return;
    const a = document.createElement('a');
    a.href = this.pdfPreviewUrl;
    a.download = `Termo_Upgrade_Contrato_${this.contract.codeContractRbx || this.contractId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  voltarParaCliente() {
    this.router.navigate(['/client-contracts', this.clientId])
  }

  backToHome() {
    this.router.navigate(['/search'])
  }

  getConsentTermPdf() {
    console.log('getConsentTermPdf clicado. (Implementar lógica de PDF se necessário)');
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
}


