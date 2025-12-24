import { AttendancesService } from './../../services/attendances/attendance.service';
import { AuthService } from './../../core/auth.service';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { FormsModule } from '@angular/forms';
import { IftaLabelModule } from 'primeng/iftalabel';
import { SelectModule } from 'primeng/select';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputGroupModule } from 'primeng/inputgroup';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContractsService } from '../../services/contracts/contracts.service';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-ticket-callcenter',
  standalone: true,
  imports: [
    CardBaseComponent,
    CommonModule,
    ButtonModule,
    FormsModule,
    TextareaModule,
    IftaLabelModule,
    SelectModule,
    InputGroupAddonModule,
    InputGroupModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './ticket-callcenter.component.html',
  styleUrl: './ticket-callcenter.component.scss',
})
export class TicketCallcenterComponent {
  constructor(
    private confirmationService: ConfirmationService,
    private router: Router,
    private route: ActivatedRoute,
    private contractService: ContractsService,
    private messageService: MessageService,
    private authService: AuthService,
    private attendanceService: AttendancesService
  ) {}

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('clientId')!;
    this.loadContracts();
  }

  clientId!: string;
  descricaoPadrao: string =
    'Olá, o cliente em questão está solicitando auxílio referente...';

  contracts: any[] = [];
  selectedContract: string | null = null;

  selectedTypeOfAttendance: any | null = null;
  typeOfAttendanceOptions = [
    {
      label: 'Suporte Técnico | Dúvidas Gerais (Tópico)',
      value: '117',
      tipo: 'T',
    },
    {
      label: 'Suporte Técnico | Sem conexão de Internet (Tópico)',
      value: '118',
      tipo: 'T',
    },
    { label: 'Financeiro | Inversão de Pagamento (Fluxo)', value: '39' },
    { label: 'Financeiro | Recebimento de Comprovante (Fluxo)', value: '27' 
    },
    {label: 'Técnico | Suporte Fibra - Rede Interna (Tópico)', value: '108', 
      tipo: 'T'
    },
  ];

  confirmAction() {
    this.confirmationService.confirm({
      message: 'Tem certeza que deseja confirmar esta ação?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        const isTopico = this.selectedTypeOfAttendance?.tipo != null;

        const payload = {
          clienteId: this.clientId,
          sellerId: this.authService.getSellerId(),
          contrato: this.selectedContract ?? null,
          fluxo: !isTopico ? this.selectedTypeOfAttendance?.value : null,
          topico: isTopico ? this.selectedTypeOfAttendance?.value : null,
          tipo: isTopico ? this.selectedTypeOfAttendance?.tipo : null,
          assunto: this.descricaoPadrao,
        };

        console.log('Payload final:', payload);

        this.attendanceService.createAttendance(payload).subscribe({
          next: (response) => {
            
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Atendimento criado com sucesso!',
            });

            this.selectedContract = null;
            this.selectedTypeOfAttendance = null;
            this.descricaoPadrao =
              'Olá, o cliente em questão está solicitando auxílio referente...';
          },
          error: (err) => {
            console.error('Erro ao criar atendimento:', err);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Não foi possível criar o atendimento.',
            });
          },
        });
      },
    });
  }

  loadContracts() {
    this.contractService
      .getContractsActivesAndWaitByClient(this.clientId)
      .subscribe({
        next: (data) => {
          this.contracts = data.map((contract: any) => ({
            label: `${contract.codeContractRbx} - ${contract.planName}`,
            value: contract.codeContractRbx,
          }));
        },
        error: () => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível carregar os contratos',
          });
        },
      });
  }

  btnToBack() {
    this.router.navigate(['info', this.clientId]);
  }


  isFormValid(): boolean {
  return (
    this.selectedTypeOfAttendance != null &&
    this.selectedContract != null &&
    this.descricaoPadrao.trim().length > 0
  );
}
}
