import { ContractsService } from './../../services/contracts/contracts.service';
import { Contract } from './../../models/contract/contract.dto';
import { Component, inject } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepPanels } from 'primeng/stepper';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { ActivatedRoute, Router } from '@angular/router';
import { Cliente } from '../../models/cliente/cliente.dto';
import { ClientService } from '../../services/clients/client.service';
import { SelectModule } from 'primeng/select';
import { forkJoin } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-alterdateexpired',
  imports: [
    CardBaseComponent,
    StepPanels,
    StepperModule,
    ButtonModule,
    SelectModule,
    CommonModule,
    DatePipe,
    FormsModule
  ],
  templateUrl: './alter-date-expired.component.html',
  styleUrl: './alter-date-expired.component.scss',
})
export class AlterDateExpiredComponent {
  clientId!: string;
  contractId!: string;

  contract!: Contract;
  client!: Cliente;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly contractService = inject(ContractsService);
  private readonly clientService = inject(ClientService);

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.clientId = params['clientId'];
      this.contractId = params['contractId'];

      if (this.contractId && this.clientId) {
        this.loadContractAndClient(this.contractId, this.clientId);
      }
    });
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
    { descricao: '13 a 12 / 13', value: '13 a 12 / 13' },
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
    { descricao: '29 a 28 / 29', value: '29 a 28 / 29' },
    { descricao: '30 a 29 / 30', value: '30 a 29 / 30' },
    { descricao: '31 a 30 / 31', value: '31 a 30 / 31' },
  ];

  loadContractAndClient(contractId: string, clientId: string) {
    forkJoin({
      contract: this.contractService.getContractById(contractId),
      client: this.clientService.getClientById(clientId),
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

  voltarParaCliente() {
    this.router.navigate(['/client-contracts', this.clientId]);
  }

  backToHome() {
    this.router.navigate(['/search']);
  }

  get formattedDateSignature(): Date | null {
    return this.contract?.dateSignature
      ? new Date(this.contract.dateSignature)
      : null;
  }

  get formattedDateStart(): Date | null {
    return this.contract?.dateStart ? new Date(this.contract.dateStart) : null;
  }
}
