import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

// PrimeNG Modules
import { ButtonModule } from 'primeng/button';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { Popover, PopoverModule } from 'primeng/popover';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { SelectModule } from 'primeng/select';
import { StepperModule } from 'primeng/stepper';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';

// Services and Models
import { ConfirmationService, MessageService } from 'primeng/api';
import { AuthService } from '../../core/auth.service';
import { Cliente as ClientData } from '../../models/cliente/cliente.dto';
import { Contract } from '../../models/contract/contract.dto';
import { ClientService } from '../../services/clients/client.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { SearchclientService } from '../../services/searchclient/searchclient.service';

// Components
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { IftaLabel } from "primeng/iftalabel";
import { ActionsContractsService } from '../../services/actionsToContract/actions-contracts.service';

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
    InputMaskModule, 
    InputTextModule,
    InputNumberModule, 
    InputGroupModule, 
    InputGroupAddonModule, 
    IftaLabel, 
    PopoverModule, 
    ProgressSpinnerModule,
    SelectModule, 
    StepperModule, 
    ToastModule, 
    TooltipModule,
    CardBaseComponent
  ],
  templateUrl: './transfer-ownership.component.html',
  styleUrl: './transfer-ownership.component.scss',
  providers: [ConfirmationService, MessageService],
})
export class TransferOwnershipComponent implements OnInit {
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

  // --- Estado Geral do Componente ---
  clientId!: string;
  ContractId!: string;
  contracts: Contract[] = []; // Usado para a lista na página anterior, pode ser adaptado
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
  pdfSrc: SafeResourceUrl | null = null;
  isLoadingPdf: boolean = false;
  consentAgreed: boolean = false;
  autentiqueModalVisible: boolean = false;
  phone: string = '';

  ngOnInit() {
    // Lógica para carregar os dados iniciais do contrato e cliente
    const clientId = this.route.snapshot.paramMap.get('clientId');
    const contractId = this.route.snapshot.paramMap.get('contractId'); // Supondo que o ID do contrato venha da rota
    if (clientId && contractId) {
      this.clientId = clientId;
      this.loadInitialData(clientId, contractId);
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
        if (response?.client?.id && response?.client?.name) {
          this.foundClient = { id: response.client.id, name: response.client.name };
          this.showInfo('Cliente Localizado', `O cliente ${response.client.name} está pronto para a transferência.`);
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
    this.activeStepIndex = 2; // Avança para o passo 3 (visualização do PDF)
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
      },
      error: (err) => {
        this.showError('Erro ao Gerar PDF', err.error?.message || 'Não foi possível carregar o termo de consentimento.');
        this.isLoadingPdf = false;
      }
    });
  }

  // Este método é chamado no final do fluxo de Assinatura Manual
  onConfirmTransfer(): void {
    if (!this.selectedContractForTransfer || !this.foundClient) return;

    this.isLoadingTransfer = true;
    this.loadingMessage = 'A efetivar a transferência, por favor aguarde...';
    const oldContractId = this.selectedContractForTransfer.id;
    const newClientId = this.foundClient.id;

    this.contractService.transferOwnership(oldContractId, newClientId).subscribe({
      next: () => {
        this.activeStepIndex = 3; // Avança para o passo de Finalização/Sucesso
        this.showSuccess('Sucesso!', 'A transferência de titularidade foi concluída.');
        this.isLoadingTransfer = false;
        // Opcional: Redirecionar após alguns segundos
        // setTimeout(() => this.navigateToInfoClient(), 3000);
      },
      error: (err) => {
        this.showError('Erro na Transferência', err.error?.message || 'Não foi possível concluir a transferência.');
        this.isLoadingTransfer = false;
        this.activeStepIndex = 0; // Volta para o primeiro passo em caso de erro.
      },
    });
  }

  // --- MÉTODOS PARA O MODAL AUTENTIQUE ---
  abrirModalAutentique(): void {
    this.autentiqueModalVisible = true;
    this.phone = '';
  }

  fecharModalAutentique(): void {
    this.autentiqueModalVisible = false;
  }

  sendToAutentiqueSubmit(): void {
    if (!this.currentClient || !this.foundClient || !this.selectedContractForTransfer) {
      this.showError('Erro de Dados', 'Não foi possível obter os dados completos dos titulares ou do contrato.');
      return;
    }
    const mappedSigners = [
      { 
        name: this.currentClient.name, 
        phone: '+55' + (this.currentClient.celular1 || '').replace(/\D/g, '') 
      },
      { 
        name: this.foundClient.name, 
        phone: '+55' + this.phone.replace(/\D/g, '')
      }
    ];

    const payload = { 
      signers: mappedSigners
    };
    
    this.isLoadingTransfer = true;
    this.loadingMessage = 'A enviar documento para assinatura...';
    this.fecharModalAutentique();

    this.actionsContractsService
      .sendTransferOwnershipAutentique(payload, this.selectedContractForTransfer.id, this.foundClient.id)
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

  private isTransferringToSameOwner(documentoParaBuscar: string): boolean {
    if (!this.currentClient) return false;
    const isInputCpf = documentoParaBuscar.length === 11;
    const cpfAtual = this.currentClient.cpf?.replace(/\D/g, '');
    const cnpjAtual = this.currentClient.cnpj?.replace(/\D/g, '');
    return (isInputCpf && cpfAtual === documentoParaBuscar) || (!isInputCpf && cnpjAtual === documentoParaBuscar);
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    if (!/^\d$/.test(event.key) && !['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab', 'Enter'].includes(event.key)) {
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

