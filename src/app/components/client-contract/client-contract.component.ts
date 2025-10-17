import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { Divider, DividerModule } from 'primeng/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { StepsModule } from 'primeng/steps';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Contract } from '../../models/contract/contract.dto';
import { ContractsService } from '../../services/contracts/contracts.service';
import { CalendarModule } from 'primeng/calendar';
import { InputNumberModule } from 'primeng/inputnumber';
import { AuthService } from '../../core/auth.service';
import { ConfirmDialog, ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { InputMaskModule } from 'primeng/inputmask';
import { ClientService } from '../../services/clients/client.service';
import { SearchclientService } from '../../services/searchclient/searchclient.service';
import { Cliente as ClientData } from '../../models/cliente/cliente.dto';
import { IftaLabel } from "primeng/iftalabel";
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CheckboxModule } from 'primeng/checkbox';
import { Stepper, StepperModule } from "primeng/stepper";
import { InputGroupModule } from "primeng/inputgroup";
import { InputGroupAddonModule } from "primeng/inputgroupaddon";
import { InputTextModule } from 'primeng/inputtext';

export interface Seller {
  name: string;
}

export interface Plan {
  plan: string;
}

@Component({
  selector: 'app-client-contract',
  standalone: true,
  imports: [
    // Módulos Essenciais do Angular
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Componentes da sua Aplicação
    CardBaseComponent,
    // Módulos do PrimeNG
    ButtonModule,
    CalendarModule,
    CheckboxModule,
    ConfirmDialogModule,
    DialogModule,
    DividerModule,
    InputMaskModule,
    InputNumberModule,
    PopoverModule,
    ProgressSpinnerModule,
    SelectModule,
    ToastModule,
    StepsModule,
    TooltipModule,
    StepperModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule
],
  templateUrl: './client-contract.component.html',
  styleUrl: './client-contract.component.scss',
  providers: [ConfirmationService, MessageService],
})


export class ClientContractComponent implements OnInit {

  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly searchclientService = inject(SearchclientService)
  private readonly clientService = inject(ClientService)
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  private currentClient: ClientData | null = null;
  contracts: Contract[] = [];
  loadingBillingDialog: boolean = false;
  isLoading = false;
  dialogTitle: string = '';
  downgradeDialog: boolean = false;
  upgradeDialog: boolean = false;
  dialogBilling: boolean = false;
  selectedBillingCycle: string | null = null;
  selectedContract!: Contract;
  clientId!: string;
  upgradeForm!: FormGroup;
  selectedContractForUpgrade: Contract | null = null;

  // --- Estado para Dialog de Transferência de Titularidade (NOVA VERSÃO COM STEPPER) ---
  transferDialogVisible: boolean = false;
  selectedContractForTransfer: Contract | null = null;
  isLoadingTransfer: boolean = false;
  loadingMessage: string = '';
  documento: string = '';
  foundClient: { id: string, name: string } | null = null;

  // Propriedades do Stepper
  activeStepIndex: number = 0;
  pdfSrc: SafeResourceUrl | null = null;
  isLoadingPdf: boolean = false;
  consentAgreed: boolean = false;
  autentiqueModalVisible: boolean = false;
  phone: string = '';

  typesOfDateExpirationCicle = [
    { dia: '1', vencimento: '1', descricao: '01 a 31 / 01 ', value: '1' },
    { dia: '2', vencimento: '2', descricao: '02 a 01 / 02', value: '2' },
    { dia: '3', vencimento: '3', descricao: '03 a 02 / 03', value: '3' },
    { dia: '4', vencimento: '4', descricao: '04 a 03 / 04', value: '4' },
    { dia: '5', vencimento: '5', descricao: '05 a 04 / 05', value: '5' },
    { dia: '6', vencimento: '6', descricao: '06 a 05 / 06', value: '6' },
    { dia: '7', vencimento: '7', descricao: '07 a 06 / 07', value: '7' },
    { dia: '8', vencimento: '8', descricao: '08 a 07 / 08', value: '8' },
    { dia: '9', vencimento: '9', descricao: '09 a 08 / 09', value: '9' },
    { dia: '10', vencimento: '10', descricao: '10 a 09 / 10', value: '10' },
    { dia: '11', vencimento: '11', descricao: '11 a 10 / 11', value: '11' },
    { dia: '12', vencimento: '12', descricao: '12 a 11 / 12', value: '12' },
    { dia: '12', vencimento: '13', descricao: '12 a 11 / 13', value: '13' },
    { dia: '14', vencimento: '14', descricao: '14 a 13 / 14', value: '14' },
    { dia: '15', vencimento: '15', descricao: '15 a 14 / 15', value: '15' },
    { dia: '16', vencimento: '16', descricao: '16 a 15 / 16', value: '16' },
    { dia: '17', vencimento: '17', descricao: '17 a 16 / 17', value: '17' },
    { dia: '18', vencimento: '18', descricao: '18 a 17 / 18', value: '18' },
    { dia: '19', vencimento: '19', descricao: '19 a 18 / 19', value: '19' },
    { dia: '20', vencimento: '20', descricao: '20 a 19 / 20', value: '20' },
    { dia: '21', vencimento: '21', descricao: '21 a 20 / 21', value: '21' },
    { dia: '22', vencimento: '22', descricao: '22 a 21 / 22', value: '22' },
    { dia: '23', vencimento: '23', descricao: '23 a 22 / 23', value: '23' },
    { dia: '24', vencimento: '24', descricao: '24 a 23 / 24', value: '24' },
    { dia: '25', vencimento: '25', descricao: '25 a 24 / 25', value: '25' },
    { dia: '26', vencimento: '26', descricao: '26 a 25 / 26', value: '26' },
    { dia: '27', vencimento: '27', descricao: '27 a 26 / 27', value: '27' },
    { dia: '28', vencimento: '28', descricao: '28 a 27 / 28', value: '28' },
    { dia: '28', vencimento: '29', descricao: '28 a 27 / 29', value: '29' },
    { dia: '28', vencimento: '30', descricao: '28 a 27 / 30', value: '30' },
    { dia: '28', vencimento: '31', descricao: '28 a 27 / 31', value: '31' },
  ];

  // --- MÉTODOS DO CICLO DE VIDA ---
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id;
      this.loadContracts(this.clientId);
      this.loadCurrentClientData(this.clientId);
    }

    this.upgradeForm = this.fb.group({
      codePlan: [null, Validators.required],
      descountFixe: [0, Validators.required],
      expirationCycle: [null, Validators.required],
      cicleFatId: [null],
      cicleBillingDayBase: [null],
      cicleBillingExpired: [null],
    });

    this.upgradeForm.get('expirationCycle')?.valueChanges.subscribe(selectedCycle => {
      if (selectedCycle) {
        this.upgradeForm.patchValue({
          cicleFatId: selectedCycle.value,
          cicleBillingDayBase: selectedCycle.dia,
          cicleBillingExpired: selectedCycle.vencimento
        }, { emitEvent: false });
      }
    });
  }

  // --- MÉTODOS DE CARREGAMENTO DE DADOS (Originais) ---
  loadContracts(clientId: string) {
    this.contractService.getContractsActivesAndWaitByClient(clientId).subscribe({
      next: (data) => (this.contracts = data),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar os contratos',
        });
      },
    });
  }

  loadCurrentClientData(clientId: string): void {
    this.clientService.getClientById(clientId).subscribe({
      next: (data) => {
        this.currentClient = data;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro Crítico',
          detail: 'Não foi possível carregar os dados do titular do contrato.',
        });
      },
    });
  }

  loadAllContracts(clientId: string) {
    this.contractService.getAllContractsByClient(clientId).subscribe({
      next: (data) => (this.contracts = data),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar todos os contratos',
        });
      },
    });
  }

  loadContractsBlockeds(clientId: string) {
    this.contractService.getContractsBlockedsByClient(clientId).subscribe({
      next: (data) => (this.contracts = data),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar todos os contratos',
        });
      },
    });
  }

  loadContractsActives(clientId: string) {
    this.contractService.getContractsActivesByClient(clientId).subscribe({
      next: (data) => (this.contracts = data),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar todos os contratos',
        });
      },
    });
  }

  loadContractsTransfer(clientId: string) {
    this.contractService.getContractsTransfersByClient(clientId).subscribe({
      next: (data) => (this.contracts = data),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar todos os contratos',
        });
      },
    });
  }


  // --- MÉTODOS PARA TRANSFERÊNCIA DE TITULARIDADE (FLUXO COM STEPPER) ---
  closeTransferDialog(): void {
    this.transferDialogVisible = false;
  }

   onSearchNewOwner(): void {
    const documentoParaBuscar = this.documento.replace(/\D/g, '');
    if (documentoParaBuscar.length < 11) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Por favor, preencha o documento completo.' });
      return;
    }
    if (this.isTransferringToSameOwner(documentoParaBuscar)) {
      this.messageService.add({ severity: 'warn', summary: 'Operação Inválida', detail: 'Não é possível transferir um contrato para o mesmo titular.' });
      return;
    }
    this.isLoadingTransfer = true;
    this.loadingMessage = 'A procurar e a sincronizar o cliente...';
    this.searchclientService.searchAndRegisterClient(documentoParaBuscar).subscribe({
      next: (response) => {
        this.isLoadingTransfer = false;
        if (response?.client?.id && response?.client?.name) {
          this.foundClient = { id: response.client.id, name: response.client.name };
          this.messageService.add({ severity: 'info', summary: 'Cliente Localizado', detail: `O cliente ${response.client.name} está pronto para a transferência.` });
        } else {
          this.foundClient = null; // Garante que o botão 'Próximo' fique desabilitado.
          this.messageService.add({ severity: 'warn', summary: 'Cliente não encontrado', detail: response.message || 'Nenhum cliente encontrado com este documento.' });
        }
      },
      error: (err) => {
        this.isLoadingTransfer = false;
        this.messageService.add({ severity: 'error', summary: 'Erro na Procura', detail: err.error?.message || 'Não foi possível procurar o cliente.' });
      },
    });
  }

  goToConsentStep(): void {
    this.activeStepIndex = 1;
    this.isLoadingPdf = true;
    this.pdfSrc = null;
    this.consentAgreed = false;

    const oldContractId = this.selectedContractForTransfer?.id;
    const newClientId = this.foundClient?.id;

    if (!oldContractId || !newClientId) {
      this.messageService.add({ severity: 'error', summary: 'Erro de Dados', detail: 'Dados do contrato ou do novo cliente não foram encontrados.' });
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
        this.messageService.add({ severity: 'error', summary: 'Erro ao Gerar PDF', detail: err.error?.message || 'Não foi possível carregar o termo de consentimento.' });
        this.isLoadingPdf = false;
      }
    });
  }

  onConfirmTransfer(): void {
    if (!this.selectedContractForTransfer || !this.foundClient) return;

    this.isLoadingTransfer = true;
    this.loadingMessage = 'Efetivando transferência, por favor aguarde...';
    const oldContractId = this.selectedContractForTransfer.id;
    const newClientId = this.foundClient.id;

    this.contractService.transferOwnership(oldContractId, newClientId).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso!', detail: 'A transferência de titularidade foi concluída.' });
        this.isLoadingTransfer = false;
        setTimeout(() => {
          this.closeTransferDialog();
          this.loadContracts(this.clientId);
        }, 1500);
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Erro na Transferência', detail: err.error?.message || 'Não foi possível concluir a transferência.' });
        this.isLoadingTransfer = false;
        this.activeStepIndex = 0;
      },
    });
  }

  goBackStep(stepIndex: number): void {
    this.activeStepIndex = stepIndex;
  }

  // --- MÉTODOS DE UPGRADE/DOWNGRADE E OUTROS DIALOGS (Originais) ---
  openUpgradeDialog(contract: Contract, isUpgrade: boolean) {
    this.dialogTitle = isUpgrade ? 'Upgrade de Contrato' : 'Downgrade de Contrato';
    this.selectedContractForUpgrade = contract;
    this.upgradeDialog = true;
  }

  openDowngradeDialog() {
    this.downgradeDialog = true;
  }

  openBillingDialog(contract: Contract) {
    this.selectedContract = contract;
    this.dialogBilling = true;
  }

  submitUpgrade() {
    if (this.upgradeForm.invalid) {
      this.upgradeForm.markAllAsTouched();
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'Preencha todos os campos obrigatórios.' });
      return;
    }
    if (!this.selectedContractForUpgrade) return;

    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Sessão inválida ou ID do vendedor não encontrado.' });
      return;
    }
    const formData = this.upgradeForm.getRawValue();
    const payload = {
      seller: sellerId,
      codePlan: formData.codePlan,
      descountFixe: formData.descountFixe,
      cicleFatId: formData.cicleFatId,
      cicleBillingDayBase: formData.cicleBillingDayBase,
      cicleBillingExpired: formData.cicleBillingExpired,
    };
    const contractId = this.selectedContractForUpgrade.id;

    this.contractService.upgradeContract(contractId, payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Contrato atualizado com sucesso!' });
        this.onHideUpgradeDialog();
        this.loadContracts(this.clientId);
      },
      error: (err) => {
        const detailMessage = err.error?.message || 'Não foi possível atualizar o contrato.';
        this.messageService.add({ severity: 'error', summary: 'Erro de Regra de Negócio', detail: detailMessage });
        console.error('Erro detalhado:', err);
      }
    });
  }

  onHideUpgradeDialog() {
    this.upgradeDialog = false;
    this.upgradeForm.reset();
    this.selectedContractForUpgrade = null;
  }


  // --- MÉTODOS DIVERSOS (Originais) ---
  confirmTransferDate(contract: Contract) {
    this.confirmationService.confirm({
      message: 'Deseja realmente alterar a data de vencimento deste contrato?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.transferDateExpired(contract),
      reject: () => this.messageService.add({ severity: 'info', summary: 'Cancelado', detail: 'Ação cancelada.' }),
    });
  }

  transferDateExpired(contract: Contract) {
    this.loadingBillingDialog = true;
    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'SellerId não encontrado no token!' });
      this.loadingBillingDialog = false;
      return;
    }
    const payload = {
      clientId: contract.clientId,
      contractNumber: contract.codeContractRbx,
      billingCycleLabel: this.selectedBillingCycle!,
      sellerId: sellerId.toString(),
    };
    this.contractService['changeBillingDate'](payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sucesso', detail: 'Data de vencimento alterada com sucesso!' });
        this.dialogBilling = false;
        this.loadingBillingDialog = false;
      },
      error: (err: { error: { errorMessage: string; }; }) => {
        const backendMessage = err?.error?.errorMessage || 'Não foi possível alterar a data de vencimento.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: backendMessage });
        this.loadingBillingDialog = false;
      },
    });
  }

  toggle(popover: Popover, event: Event) {
    if (popover.overlayVisible) {
      popover.hide();
    } else {
      popover.show(event);
    }
  }

   abrirModalAutentique(): void {
    this.autentiqueModalVisible = true;
    this.phone = '';
  }

  fecharModalAutentique(): void {
    this.autentiqueModalVisible = false;
  }

  sendToAutentiqueSubmit(): void {
    console.log('Enviando para o Autentique com o telefone:', this.phone);
    this.messageService.add({ severity: 'info', summary: 'Processo Iniciado', detail: 'O termo foi enviado para assinatura via Autentique.' });
    this.fecharModalAutentique();
    this.closeTransferDialog();
  }

  // --- MÉTODOS DE NAVEGAÇÃO E UTILITÁRIOS (Originais) ---
  navigateToCreatContract() { this.router.navigate(['add-contract']); }
  navigateToInfoClient() { this.router.navigate(['info', this.clientId]); }
  navigateToAddressTransfer() { this.router.navigate(['address-transfer']); }
  navigateTransferDialog() { this.router.navigate (['transfer-ownership']) }
  navigateToCreateClient(): void {
    this.router.navigate(['/register']);
    this.closeTransferDialog();
  }
  goToAlterDateExpired(contract: Contract) {
    this.router.navigate(['/alter-dateexpired'], {
      queryParams: { clientId: this.clientId, contractId: contract.id },
    });
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

  onHide() {
    this.upgradeDialog = false;
    this.upgradeForm.reset();
    this.selectedContractForUpgrade = null;
  }

  listToAllContracts() {
    this.loadAllContracts(this.clientId);
  }

  listBlockedsContracts() {
    this.loadContractsBlockeds(this.clientId);
  }

  listActivesContracts() {
    this.loadContractsActives(this.clientId);
  }

  listTransferContracts() {
    this.loadContractsTransfer(this.clientId);
  }
}