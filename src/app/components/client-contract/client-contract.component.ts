import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { Divider } from 'primeng/divider';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import {
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { Contract } from '../../models/contract/contract.dto';
import { ContractsService } from '../../services/contracts/contracts.service';

export interface Seller {
  name: string;
}

export interface Plan {
  plan: string;
}
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
  ],
  templateUrl: './client-contract.component.html',
  styleUrl: './client-contract.component.scss',
  providers: [MessageService],
})
export class ClientContractComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly authService = inject(ContractsService);

  isLoading = false;

  downgradeDialog: boolean = false;
  upgradeDialog: boolean = false;

  clientId!: string;

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('clientId');
    if (id) {
      this.clientId = id; // salva na propriedade
      this.loadContracts(this.clientId);
    }
  }

  contracts: Contract[] = [];

  

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

  onHide() {}

  listToAllContracts() {
    this.loadAllContracts(this.clientId);
  }

  listBlockedsContracts() {
    this.loadContractsBlockeds(this.clientId);
  }

  listActivesContracts(){
    this.loadContractsActives(this.clientId);
  }

  listTransferContracts(){
    this.loadContractsTransfer(this.clientId);
  }

  navigateToAddressTransfer(contract: Contract) {
    this.router.navigate(['address-transfer'], {
      queryParams: {fromClient: this.clientId}
    });
  }
}
