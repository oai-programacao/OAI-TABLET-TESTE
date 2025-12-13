import { Component, inject } from '@angular/core';
import { ButtonModule } from "primeng/button";
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { Contract } from '../../models/contract/contract.dto';
import { Cliente } from '../../models/cliente/cliente.dto';
import { ContractSuspenseDTO } from '../../models/contract/contractSuspense.dto';
import { ActivatedRoute, Router } from '@angular/router';
import { StepperModule } from "primeng/stepper";
import { ClientService } from '../../services/clients/client.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { DialogModule } from "primeng/dialog";
import { DropdownModule } from "primeng/dropdown";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { TableModule } from "primeng/table";

@Component({
  selector: 'app-activate-contract',
  imports: [
    ButtonModule,
    CardBaseComponent,
    StepperModule,
    DatePipe,
    DialogModule,
    DropdownModule,
    ProgressSpinnerModule,
    TableModule,
    CurrencyPipe,
    CommonModule
  ],
  templateUrl: './activate-contract.component.html',
  styleUrl: './activate-contract.component.scss'
})
export class ActivateContractComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);

  private clienteService = inject(ClientService);

  public activeStep: number = 1;

  contract!: Contract;
  client!: Cliente;
  contractSuspense!: ContractSuspenseDTO;
  clientId!: string;
  contractId!: string;
  activationDate!: string | null;
  result: any = null;

  modalVisible: boolean = false;
  isSubmitting: boolean = false;
  finalization: boolean = false;

  daysSuspended: number = 0;
  proportionalBoleto: number = 0;
  proportionalBoletoBefore: number = 0;

  //Flags
  loadingContract = false;
  loadingSuspense = false;
  loadTheRbx = false;

  ngOnInit(): void {
    const contractId = this.route.snapshot.paramMap.get('contractId');
    console.log('ID recebido da rota:', contractId);
    this.route.params.subscribe(params => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];
    })
    if (!contractId) {
      console.error("Nenhum suspenseId encontrado na rota!");
      return
    }
    this.activationDate = new Date().toISOString().split('T')[0];
    this.contractId = contractId
    this.loadContract(contractId);
    this.loadContractSuspense(contractId);
  }

  loadContractSuspense(id: string) {
    this.loadingSuspense = true;

    this.contractService.getContractSuspenseById(id).subscribe({
      next: res => {
        this.contractSuspense = res;
        this.loadingSuspense = false;
        this.tryCalculateProportional();
      },
      error: err => {
        console.warn("Contrato sem suspensão cadastrada");
        this.contractSuspense = null as any;
        this.loadingSuspense = false;
        this.tryCalculateProportional();
      }
    });
  }

  loadContract(id: string) {
    this.loadingContract = true;

    this.contractService.getContractById(id).subscribe({
      next: c => {
        this.contract = c;
        this.clientId = c.clientId;

        this.clienteService.getClientById(this.clientId!).subscribe(client => {
          this.client = client;
        });

        this.loadingContract = false;
        this.tryCalculateProportional();
      },
      error: () => {
        console.error("Erro ao carregar contrato");
        this.loadingContract = false;
        this.tryCalculateProportional();
      }
    });
  }

  tryCalculateProportional() {
    if (!this.loadingContract && !this.loadingSuspense && this.contract && this.activationDate) {
      this.proportionalBoletoBefore = this.calculateProportionalBefore();
      console.log("💰 Proporcional recalculado => ", this.proportionalBoletoBefore);
    }
  }

  calculateDuration(start: string, end: string): number {
    if (!start || !end) return 0;

    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  calculateSuspendedDays() {
    if (!this.contractSuspense?.startDate || !this.activationDate) {
      console.warn("Datas insuficientes para calcular suspensão");
      this.daysSuspended = 0;
      return 0;
    }

    const start = new Date(this.contractSuspense.startDate);
    const end = new Date(this.activationDate);

    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    this.daysSuspended = days > 0 ? days : 0;
    return this.daysSuspended;
  }

  calculateProportionalBefore() {
    if (
      !this.contract ||
      this.contract.liquidPrice == null ||
      !this.activationDate ||
      !this.contract.cicleBillingExpired
    ) {
      console.warn("Dados insuficientes para cálculo");
      return 0;
    }

    const liquidPrice = this.contract.liquidPrice;
    const activation = new Date(this.activationDate);

    let suspensionEnd: Date;
    if (this.contractSuspense?.finishDate) {
      suspensionEnd = new Date(this.contractSuspense.finishDate);
    } else {
      suspensionEnd = new Date(this.activationDate);
      this.loadTheRbx = true;
    }

    const suspensionStart = this.contractSuspense?.startDate
      ? new Date(this.contractSuspense.startDate)
      : null;

    let suspendedDays = 0;

    // if (suspensionStart) {
    //   // se a data de ativação for igual à data de início, não houve suspensão de fato
    //   if (suspensionEnd.getTime() > suspensionStart.getTime()) {
    //     const diffMs = suspensionEnd.getTime() - suspensionStart.getTime();
    //     suspendedDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    //   }
    // }

    const nextBilling = this.getNextBillingDate(
      this.contract.cicleBillingExpired,
      activation
    );

    const diffMs = nextBilling.getTime() - activation.getTime();
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysRemaining <= 0) return 0;

    const daysInMonth = new Date(
      nextBilling.getFullYear(),
      nextBilling.getMonth() + 1,
      0
    ).getDate();

    const pricePerDay = liquidPrice / daysInMonth;
    const payableDays = Math.max(daysRemaining - suspendedDays, 0);
    const proportional = pricePerDay * payableDays;

    this.proportionalBoleto = Number(proportional.toFixed(2));
    return this.proportionalBoleto;
  }


  getNextBillingDate(cicleDay: number, activation: Date): Date {
    const year = activation.getFullYear();
    const month = activation.getMonth();

    let nextBilling = new Date(year, month, cicleDay);

    if (nextBilling <= activation) {
      nextBilling = new Date(year, month + 1, cicleDay);
    }
    return nextBilling;
  }

  confirmSuspension() {
    this.isSubmitting = true;

    if (!this.activationDate) {
      console.error("activationDate não foi informado!");
      this.isSubmitting = false;
      return;
    }

    const payload = {
      proportional: this.proportionalBoleto,
      activationDate: this.activationDate
    };

    console.log("Payload enviado:", payload);

    this.contractService.activateContract(this.contractId, payload)
      .subscribe({
        next: (response) => {
          console.log("Contrato ativado com sucesso!", response);
          this.isSubmitting = false;
          this.finalization = true;
          const boletoLink = response.boletoUrl;

          this.result = {
            clientName: this.client?.name || this.client?.socialName || 'Cliente Indisponível',
            clientCpf: this.formatCpfCnpj(this.client?.cpf || this.client?.cnpj || 'N/A'),
            contrato: this.contract?.codeContractRbx || this.contract?.id,
            proportional: this.proportionalBoleto,
            linkBoleto: boletoLink
          };
        },
        error: err => {
          console.error("Erro ao ativar contrato:", err);
          this.isSubmitting = false;
        }
      });
  }

  hasSuspensionData(): boolean {
    return !!(
      this.contractSuspense &&
      this.contractSuspense.startDate
    );
  }

  navigateToListContracts() {
    this.router.navigate(["client-contracts", this.clientId]);
  }

  backToHome() {
    this.router.navigate(["/search"]);
  }

  abrirModal() {
    this.modalVisible = true;
  }

  navigateToInfoClient() {
    if (this.clientId) {
      this.router.navigate(["info", this.clientId])
    } else {
      this.router.navigate(["/"])
    }
  }

  formatCpfCnpj(value: string | null | undefined): string {
    if (!value) return '';
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
