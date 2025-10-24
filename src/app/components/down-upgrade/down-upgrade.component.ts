import { Component, inject } from '@angular/core';
import { FormGroup, FormsModule } from '@angular/forms';
import { Toast } from "primeng/toast";
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { Button } from "primeng/button";
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


@Component({
  selector: 'app-down-upgrade',
  standalone: true,
  imports: [
    Toast,
    CardBaseComponent,
    Button,
    StepperModule,
    CommonModule,
    SelectModule,
    FormsModule
  ],
  providers: [MessageService],
  templateUrl: './down-upgrade.component.html',
  styleUrl: './down-upgrade.component.scss'
})
export class DownUpgradeComponent {

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private planService = inject(PlanService);
  private contractService = inject(ContractsService);
  private clienteService = inject(ClientService);
  private messageService = inject(MessageService);

  clientId!: string;
  contractId!: string;

  contract: Contract = {} as Contract;
  client: Cliente = {} as Cliente;

  action!: 'upgrade' | 'downgrade';
  upgradeForm!: FormGroup;

  selectedPlan: ServicePlan | null = null;

  typesofplans: ServicePlan[] = [];

  proportionalBoleto: number | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];

      if (this.contractId && this.clientId) {
        this.loadContractAndClient(this.contractId, this.clientId);
      }
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

  loadContractAndClient(contractId: string, clientId: string) {
    forkJoin({
      contract: this.contractService.getContractById(contractId),
      client: this.clienteService.getClientById(clientId),
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

  loadContract(): void {
    this.contractService.getContractById(this.contractId).subscribe({
      next: (data) => {
        this.contract = data;
      },
      error: (err) => {
        console.error('Erro ao carregar contrato', err);
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Falha ao carregar dados do contrato.' });
      }
    });
  }

  onPlanChange(): void {
    console.log('Plano selecionado:', this.selectedPlan);
  }

  voltarParaCliente() {
    this.router.navigate(['/client-contracts', this.clientId])
  }

  backToHome() {
    this.router.navigate(['/search'])
  }

}
