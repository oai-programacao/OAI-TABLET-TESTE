import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Contract } from '../../models/contract/contract.dto';
import { ContractsService } from '../../services/contracts/contracts.service';
import { AuthService } from '../../core/auth.service';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { Popover } from 'primeng/popover';

@Component({
  selector: 'app-client-contract',
  imports: [
    CommonModule,
    CardBaseComponent,
    ButtonModule,
    Divider,
    DialogModule,
    SelectModule,
    FormsModule,
    ReactiveFormsModule,
    ToastModule,
    ConfirmDialog,
    ProgressSpinnerModule,
    Popover,
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
  private readonly authService = inject(AuthService);

  @ViewChild('pop') pop!: Popover;

  contracts: Contract[] = [];

  loadingBillingDialog: boolean = false;
  isLoading = false;
  downgradeDialog: boolean = false;
  upgradeDialog: boolean = false;
  dialogBilling: boolean = false;

  selectedContract!: Contract;

  clientId!: string;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id; // salva na propriedade
      this.loadContracts(this.clientId);
    }
  }

  selectedBillingCycle: string | null = null;
  typesOfDateExpirationCicle = [
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
    { descricao: '12 a 11 / 13', value: '12 a 11 / 13' },
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
    { descricao: '28 a 27 / 29', value: '28 a 27 / 29' },
    { descricao: '28 a 27 / 30', value: '28 a 27 / 30' },
    { descricao: '28 a 27 / 31', value: '28 a 27 / 31' },
  ];

  loadContracts(clientId: string) {
    this.contractService
      .getContractsActivesAndWaitByClient(clientId)
      .subscribe({
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

  goToAlterDateExpired(contract: Contract) {
    this.router.navigate(['/alter-dateexpired'], {
      queryParams: { clientId: this.clientId, contractId: contract.id },
    });
  }

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
    this.loadingBillingDialog = true; // ativa o blockUI

    const sellerId = this.authService.getSellerId();
    if (!sellerId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'SellerId não encontrado no token!',
      });
      this.loadingBillingDialog = false; // desativa ao encontrar erro
      return;
    }

    const payload = {
      clientId: contract.clientId,
      contractNumber: contract.codeContractRbx,
      billingCycleLabel: this.selectedBillingCycle!,
      sellerId: sellerId.toString(),
    };

    this.contractService.changeBillingDate(payload).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Data de vencimento alterada com sucesso!',
        });
        this.dialogBilling = false;
        this.loadingBillingDialog = false;
      },
      error: (err) => {
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

  navigateToCreatContract() {
    this.router.navigate(['add-contract']);
  }

  navigateToInfoClient() {
    this.router.navigate(['info', this.clientId]);
  }

  openUpgradeDialog() {
    this.upgradeDialog = true;
  }

  openDowngradeDialog() {
    this.downgradeDialog = true;
  }

  openBillingDialog(contract: Contract) {
    this.selectedContract = contract;
    this.dialogBilling = true;
  }

  onHide() {}

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

  navigateToAddressTransfer() {
    this.router.navigate(['address-transfer']);
  }

  toggle(popover: any, event: Event) {
    if (popover.overlayVisible) {
      popover.hide();
    } else {
      popover.show(event);
    }
  }
}
