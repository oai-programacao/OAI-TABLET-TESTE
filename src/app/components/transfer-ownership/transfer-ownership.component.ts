import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

// Services and Models
import { ConfirmationService, MessageService } from 'primeng/api';
import { Cliente as ClientData } from '../../models/cliente/cliente.dto';
import { Contract } from '../../models/contract/contract.dto';
import { ClientService } from '../../services/clients/client.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { SearchclientService } from '../../services/searchclient/searchclient.service';

// Components
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { IftaLabel } from "primeng/iftalabel";
import { ActionsContractsService, CreateTransferConsentPayload } from '../../services/actionsToContract/actions-contracts.service';
import { NgxMaskDirective } from 'ngx-mask';
import SignaturePad from 'signature_pad';
import { concatMap } from 'rxjs/internal/operators/concatMap';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-transfer-ownership',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    DividerModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    IftaLabel,
    PopoverModule,
    ProgressSpinnerModule,
    SelectModule,
    StepperModule,
    NgxMaskDirective,
    ToastModule,
    TooltipModule,
    CardBaseComponent
  ],
  templateUrl: './transfer-ownership.component.html',
  styleUrl: './transfer-ownership.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class TransferOwnershipComponent implements OnInit, AfterViewInit {
  @ViewChild('signaturePadOld') signatureCanvasOld!: ElementRef<HTMLCanvasElement>;
  @ViewChild('signaturePadNew') signatureCanvasNew!: ElementRef<HTMLCanvasElement>;


  // --- Injeção de Dependências ---
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly searchclientService = inject(SearchclientService);
  private readonly clientService = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly actionsContractsService = inject(ActionsContractsService);
  private readonly sanitizer = inject(DomSanitizer);
  private signaturePadOld!: SignaturePad;
  private signaturePadNew!: SignaturePad;
  private readonly authService = inject(AuthService);

  // --- Estado Geral do Componente ---
  clientId!: string;
  ContractId!: string;
  phoneOldOwner!: string;
  phoneNewOwner!: string;
  contracts: Contract[] = []; 
  currentClient: ClientData | null = null;
  isLoading = false;

  // --- Estado para Outros Dialogs (se necessário) ---
  upgradeForm!: FormGroup;

  // --- Estado para o Fluxo de Transferência de Titularidade ---
  selectedContractForTransfer: Contract | null = null;
  isLoadingTransfer: boolean = false;
  loadingMessage: string = '';
  documento: string = '';
  foundClient: { id: string, name: string } | null = null;
  activeStepIndex: number = 0;
  pdfSrc: any;
  isLoadingPdf: boolean = false;
  consentAgreed: boolean = false;
  autentiqueModalVisible: boolean = false;


  pdfDialogVisible: boolean = false;

  ngAfterViewInit() { }

  ngOnInit() {
    const clientId = this.route.snapshot.paramMap.get('clientId');
    const contractId = this.route.snapshot.paramMap.get('contractId');

    if (clientId && contractId) {
      this.clientId = clientId;
      this.loadInitialData(clientId, contractId);
    } else {
      this.isLoading = false;
      this.showError('Erro Crítico', 'Faltam os IDs do cliente ou do contrato na URL.');
    }
  }

  loadInitialData(clientId: string, contractId: string): void {
    this.isLoading = true;
    this.clientService.getClientById(clientId).subscribe(client => {
      this.currentClient = client;
    });
    this.contractService.getContractById(contractId).subscribe(contract => {
      this.selectedContractForTransfer = contract;
      this.isLoading = false;
    });
  }

  private initializeSignaturePads() {
    console.log('--- A TENTAR INICIALIZAR OS SIGNATURE PADS ---');

    if (this.signatureCanvasOld && this.signatureCanvasNew) {
      console.log('Referências dos canvas encontradas no @ViewChild.');

      this.signaturePadOld = new SignaturePad(this.signatureCanvasOld.nativeElement);
      this.signaturePadNew = new SignaturePad(this.signatureCanvasNew.nativeElement);

      this.resizeCanvas();
    } else {
      console.error('--- FALHA: As referências @ViewChild para os <canvas> não foram encontradas. ---');
    }
  }

  private resizeCanvas() {
    console.log('A redimensionar os canvas...');
    const oldCanvas = this.signatureCanvasOld.nativeElement;
    const newCanvas = this.signatureCanvasNew.nativeElement;

    console.log(`Tamanho do Canvas Antigo (offsetWidth): ${oldCanvas.offsetWidth}px`);
    console.log(`Tamanho do Canvas Novo (offsetWidth): ${newCanvas.offsetWidth}px`);

    if (oldCanvas.offsetWidth === 0 || newCanvas.offsetWidth === 0) {
      console.error('--- ERRO CRÍTICO: Os elementos canvas têm 0px de largura. O CSS pode não ter sido aplicado a tempo. ---');
      this.showError('Erro de Interface', 'Não foi possível inicializar a área de assinatura. Tente novamente.');
      return;
    }

    const ratio = Math.max(window.devicePixelRatio || 1, 1);

    oldCanvas.width = oldCanvas.offsetWidth * ratio;
    oldCanvas.height = oldCanvas.offsetHeight * ratio;
    oldCanvas.getContext('2d')?.scale(ratio, ratio);
    this.signaturePadOld.clear();

    newCanvas.width = newCanvas.offsetWidth * ratio;
    newCanvas.height = newCanvas.offsetHeight * ratio;
    newCanvas.getContext('2d')?.scale(ratio, ratio);
    this.signaturePadNew.clear();

    console.log('--- SUCESSO: Canvas redimensionados e prontos para desenhar. ---');
  }


  clearSignatureOld(): void {
    if (this.signaturePadOld) {
      this.signaturePadOld.clear();
    }
  }

  clearSignatureNew(): void {
    if (this.signaturePadNew) {
      this.signaturePadNew.clear();
    }
  }

  isConfirmDisabled(): boolean {
    return !this.signaturePadOld || this.signaturePadOld.isEmpty() ||
      !this.signaturePadNew || this.signaturePadNew.isEmpty();
  }

   voltarParaCliente() {
    this.router.navigate(['/client-contracts', this.clientId]);
  }

  // --- MÉTODOS DO FLUXO DE TRANSFERÊNCIA DE TITULARIDADE ---

  onSearchNewOwner(): void {
    const documentoParaBuscar = this.documento.replace(/\D/g, '');
    if (documentoParaBuscar.length < 11) {
      this.showWarning('Atenção', 'Por favor, preencha o documento completo.');
      return;
    }
    if (this.isTransferringToSameOwner(documentoParaBuscar)) {
      this.showWarning('Operação Inválida', 'Não é possível transferir um contrato para o mesmo titular.');
      return;
    }
    this.isLoadingTransfer = true;
    this.loadingMessage = 'A procurar e a sincronizar o cliente...';
    this.searchclientService.searchAndRegisterClient(documentoParaBuscar).subscribe({
      next: (response) => {
        this.isLoadingTransfer = false;
        const client = response?.client;
        console.log("--- DEBUG: RESPOSTA DA API ---");
        console.log("Objeto 'client' recebido:", client);
        if (client?.id) {
          const clientName = client?.name || client?.socialName || client?.fantasyName; this.foundClient = { id: client.id, name: clientName };
          this.showInfo('Cliente Localizado', `O cliente ${clientName} está pronto para a transferência.`);
        } else {
          this.foundClient = null;
          this.showWarning('Cliente não encontrado', 'Nenhum cliente foi encontrado com este documento. Pode registá-lo.');
        }
      },
      error: (err) => {
        this.isLoadingTransfer = false;
        this.showError('Erro na Procura', err.error?.message || 'Não foi possível procurar o cliente.');
      },
    });
  }

  // NOVO: Este método é chamado ao clicar em "Assinatura Manual"
  goToPdfViewerStep(): void {
    this.activeStepIndex = 2;
    this.isLoadingPdf = true;
    this.pdfSrc = null;
    this.consentAgreed = false;

    const oldContractId = this.selectedContractForTransfer?.id;
    const newClientId = this.foundClient?.id;

    if (!oldContractId || !newClientId) {
      this.showError('Erro de Dados', 'Não foram encontrados dados do contrato ou do novo cliente.');
      this.isLoadingPdf = false;
      return;
    }

    this.contractService.getTransferConsentPdf(oldContractId, newClientId).subscribe({
      next: (pdfBlob: Blob) => {
        const objectUrl = URL.createObjectURL(pdfBlob);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);
        this.isLoadingPdf = false;
        setTimeout(() => this.initializeSignaturePads(), 100);
      },
      error: (err) => {
        this.showError('Erro ao Gerar PDF', err.error?.message || 'Não foi possível carregar o termo de consentimento.');
        this.isLoadingPdf = false;
      }
    });
  }

  onConfirmTransfer(): void {
    if (this.isConfirmDisabled()) {
      this.showWarning('Ação Bloqueada', 'É necessário aceitar o termo e preencher ambas as assinaturas.');
      return;
    }

    this.isLoadingTransfer = true;
    this.loadingMessage = 'A processar a transferência de negócio...';

    const signatureOldData = this.signaturePadOld.toDataURL();
    const signatureNewData = this.signaturePadNew.toDataURL();
    const oldContractId = this.selectedContractForTransfer!.id;2
    const newClientId = this.foundClient!.id;

    const signPayload = {
      oldContractId: oldContractId,
      newClientId: newClientId,
      signatureOld: signatureOldData,
      signatureNew: signatureNewData,
    };

    this.contractService.transferOwnership(oldContractId, newClientId).pipe(
      concatMap(() => {
        this.loadingMessage = 'A carimbar assinaturas no PDF final...';
        return this.contractService.finalizeAndSignTransfer(signPayload);
      })

    ).subscribe({
      next: (signedPdfBlob: Blob) => {
        const objectUrl = URL.createObjectURL(signedPdfBlob);
        this.pdfSrc = this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl);

        this.activeStepIndex = 3;
        this.showSuccess('Sucesso!', 'A transferência foi concluída e o PDF assinado.');
        this.isLoadingTransfer = false;
      },
      error: (err) => {
        const detail = err.error?.message || 'Não foi possível concluir a operação.';
        this.showError('Erro na Operação', `${detail} (Verifique o contrato, a transferência pode ter sido concluída mesmo sem o PDF.)`);
        this.isLoadingTransfer = false;
        this.activeStepIndex = 0;
      }
    });
  }

  // --- MÉTODOS PARA O MODAL AUTENTIQUE ---
  abrirModalAutentique(): void {
    this.autentiqueModalVisible = true;
    this.phoneOldOwner = '';
    this.phoneNewOwner = '';
  }

  fecharModalAutentique(): void {
    this.autentiqueModalVisible = false;
  }


















  sendToAutentiqueSubmit(): void {
    // 1. Validação de dados (verificando se os clientes e o contrato existem)
    if (!this.currentClient || !this.foundClient || !this.selectedContractForTransfer) {
      this.showError('Erro de Dados', 'Não foi possível obter os dados completos dos titulares ou do contrato.');
      return;
    }

    const sellerIdNumber = this.authService.getSellerId();
    if (!sellerIdNumber) {
      this.showError('Erro de Autenticação', 'Não foi possível identificar o vendedor logado.');
      return;
    }
    const sellerId: string = sellerIdNumber.toString();

    const payload: CreateTransferConsentPayload = {
      sellerId: sellerId,
      newClientId: this.foundClient.id,
      signers: [
        {
          name: this.currentClient.name || '',
          phone: '+55' + (this.phoneOldOwner || '').replace(/\D/g, '')
        },
        {
          name: this.foundClient.name || '',
          phone: '+55' + (this.phoneNewOwner || '').replace(/\D/g, '')
        }
      ]
    };

    // 4. Feedback de UI
    this.isLoadingTransfer = true;
    this.loadingMessage = 'A enviar documento para assinatura...';
    this.fecharModalAutentique();

    // 5. Chamada ao NOVO Serviço
    this.actionsContractsService
      .sendTransferConsentAutentique(
        payload,
        this.clientId,
        this.selectedContractForTransfer.id
      )
      .subscribe({
        next: (res: string) => {
          this.isLoadingTransfer = false;
          this.showSuccess('Sucesso!', res, 10000);
          this.activeStepIndex = 3;
        },
        error: (err) => {
          this.isLoadingTransfer = false;
          const backendMessage = (typeof err.error === 'string' ? err.error : err?.error?.message) || 'Erro ao tentar enviar. Verifique com o Suporte!';
          this.showError('Erro no Envio', backendMessage);
        },
      });
  }





























  // --- MÉTODOS DE NAVEGAÇÃO E UTILITÁRIOS ---
  goBackStep(stepIndex: number): void {
    this.activeStepIndex = stepIndex;
  }

  navigateToInfoClient() {
    // Navega de volta para a página de onde veio, por exemplo
    if (this.clientId) {
      this.router.navigate(['info', this.clientId]);
    } else {
      this.router.navigate(['/']); // Rota de fallback
    }
  }

  public get arePhonesInvalid(): boolean {
    const cleanPhoneOld = (this.phoneOldOwner || '').replace(/\D/g, '');
    const cleanPhoneNew = (this.phoneNewOwner || '').replace(/\D/g, '');
    return cleanPhoneOld.length < 10 || cleanPhoneNew.length < 10;
  }

  private isTransferringToSameOwner(documentoParaBuscar: string): boolean {
    if (!this.currentClient) return false;
    const isInputCpf = documentoParaBuscar.length === 11;
    const cpfAtual = this.currentClient.cpf?.replace(/\D/g, '');
    const cnpjAtual = this.currentClient.cnpj?.replace(/\D/g, '');
    return (isInputCpf && cpfAtual === documentoParaBuscar) || (!isInputCpf && cnpjAtual === documentoParaBuscar);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key) &&
      !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Enter'].includes(event.key)) {
      event.preventDefault();
    }
  }

  formatarDocumento(value: string): void {
    if (!value) {
      this.documento = '';
      return;
    }
    const unformattedValue = value.replace(/\D/g, '').substring(0, 14);
    if (unformattedValue.length <= 11) {
      this.documento = unformattedValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      this.documento = unformattedValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text/plain') || '';
    setTimeout(() => this.formatarDocumento(pastedText), 0);
  }







  // Métodos de mensagens Toast
  private showSuccess(summary: string, detail: string, life: number = 3000) { this.messageService.add({ severity: 'success', summary, detail, life }); }
  private showError(summary: string, detail: string) { this.messageService.add({ severity: 'error', summary, detail }); }
  private showWarning(summary: string, detail: string) { this.messageService.add({ severity: 'warn', summary, detail }); }
  private showInfo(summary: string, detail: string) { this.messageService.add({ severity: 'info', summary, detail }); }
}