import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';
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
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Popover, PopoverModule } from 'primeng/popover';
import { TooltipModule } from 'primeng/tooltip';
import { InputMaskModule } from 'primeng/inputmask';
import { ClientService } from '../../services/clients/client.service';
import { Cliente as ClientData } from '../../models/cliente/cliente.dto';
import { CheckboxModule } from 'primeng/checkbox';
import { StepperModule } from 'primeng/stepper';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { NgxMaskDirective } from "ngx-mask";

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
    InputGroupAddonModule,
    NgxMaskDirective
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
  private readonly clientService = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

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
  searchCode: string = '';
  TemporarySuspensionScheduled: boolean = false;

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
    console.log(this.loadContracts(this.clientId))
  }

  // --- MÉTODOS DE CARREGAMENTO DE DADOS (Originais) ---
  loadContracts(clientId: string) {
    this.contractService
      .getContractsActivesAndWaitByClient(clientId)
      .subscribe({
        next: (data) => (
          this.contracts = this.sortContractsByStatus(data)
        ),
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os contratos',
          });
        },
      });
  }

  loadAllContracts(clientId: string) {
    this.contractService.getAllContractsByClient(clientId).subscribe({
      next: (data) => (this.contracts = this.sortContractsByStatus(data)),
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar todos os contratos',
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

  // --- MÉTODOS DIVERSOS (Originais) ---
  confirmTransferDate(contract: Contract) {
    this.confirmationService.confirm({
      message: 'Deseja realmente alterar a data de vencimento deste contrato?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      accept: () => this.transferDateExpired(contract),
      reject: () =>
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'Ação cancelada.',
        }),
    });
  }

  transferDateExpired(contract: Contract) {
    this.loadingBillingDialog = true;
    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'SellerId não encontrado no token!',
      });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Data de vencimento alterada com sucesso!',
        });
        this.dialogBilling = false;
        this.loadingBillingDialog = false;
      },
      error: (err: { error: { errorMessage: string } }) => {
        const backendMessage =
          err?.error?.errorMessage ||
          'Não foi possível alterar a data de vencimento.';
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: backendMessage,
        });
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

  // --- MÉTODOS DE NAVEGAÇÃO E UTILITÁRIOS (Originais) ---
  navigateToCreatContract() {
    const clientId = this.route.snapshot.paramMap.get('clientId');
    this.router.navigate(['add-contract'], { queryParams: { clientId } });
  }

  navigateToCancelContract(contract: Contract) {
  this.router.navigate(['/cancel-contract', contract.id]);
}
  navigateToInfoClient() {
    this.router.navigate(['info', this.clientId]);
  }

  navigateToTransferOwnership(contract: Contract): void {
    this.router.navigate(['/transfer-ownership', this.clientId, contract.id]);
  }

  navigateToSuspension(contract: Contract): void {
    this.router.navigate(['/suspension-temporary', this.clientId, contract.id])
  }

  openUpgradeDialog(contract: Contract, isUpgrade: boolean) {
    const action = isUpgrade ? 'upgrade' : 'downgrade';
    this.router.navigate([
      `/upgrade-downgrade`,
      this.clientId,
      action,
      contract.id,
    ]);
  }

  suspensionScheduled(contract: Contract): void {
    this.TemporarySuspensionScheduled = contract.suspensionScheduled == 1;
  }

  goToAlterDateExpired(contract: Contract) {
    this.router.navigate(['/alter-dateexpired'], {
      queryParams: { clientId: this.clientId, contractId: contract.id },
    });
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
  navigateToAddressTransfer(contract: Contract) {
    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      console.error('Id do vendedor não encontrado');
      return;
    }
    this.router.navigate(['address-transfer'], {
      queryParams: {
        fromClient: contract.clientId,
        contractId: contract.id,
      },

      state: {
        contractData: contract,
      },
    });
  }

  searchContractByRbxCode() {
    if (!this.searchCode.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Digite o número RBX para pesquisar.',
      });
      return;
    }

    this.isLoading = true;
    this.contractService
      .getContractByRbxCode(this.clientId, this.searchCode)
      .subscribe({
        next: (contract) => {
          // Se quiser mostrar apenas ele:
          this.contracts = [contract];
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail:
              err?.error?.message ||
              'Contrato não encontrado para este cliente.',
          });
        },
      });
  }

  private sortContractsByStatus(contracts: Contract[]): Contract[] {
    const priorityOrder = ['ATIVO', 'AGUARDANDO_INSTALACAO', 'BLOQUEADO', 'TRANSFERIDO', 'CANCELADO'];

    return contracts.sort((a, b) => {
      const priorityA = priorityOrder.indexOf(a.situationDescription);
      const priorityB = priorityOrder.indexOf(b.situationDescription);
      return priorityA - priorityB;
    });
  }

  handleOpenDialogValidation(contract: any, isUpgrade: boolean): void {
    const dateString = contract.dateStart;

    const today = new Date();
    const todayISO = today.getFullYear() + '-' +
      String(today.getMonth() + 1).padStart(2, '0') + '-' +
      String(today.getDate()).padStart(2, '0');
    const todayForComparison = new Date(todayISO);

    let contractDateString;

    if (dateString.includes('/')) {
      const parts = dateString.split('/');
      contractDateString = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      contractDateString = dateString.substring(0, 10);
    }
    const contractStartDate = new Date(contractDateString);
    if (contractStartDate.getTime() >= todayForComparison.getTime()) {

      this.messageService.add({
        severity: 'error',
        summary: 'Ação Bloqueada',
        detail: 'Não é possível realizar a alteração em contratos que iniciam hoje ou em datas futuras.',
        life: 5000
      });

    } else {

      this.openUpgradeDialog(contract, isUpgrade);
    }
  }
}
