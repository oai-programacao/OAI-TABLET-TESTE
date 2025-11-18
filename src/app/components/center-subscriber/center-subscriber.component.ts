import { ContractsService } from './../../services/contracts/contracts.service';
import { ClientService } from './../../services/clients/client.service';
import { CommonModule } from '@angular/common';
import { Component, type OnInit } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { ActivatedRoute, Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { DividerModule } from 'primeng/divider';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { UpdateCenterSubscribeDTO } from '../../models/centersubscribe/centerSubscribe.dto';
import { Cliente } from '../../models/cliente/cliente.dto';
import { CenterSubscribeService } from '../../services/centersubscribe/centersubscribe.service';
import { Contract } from '../../models/contract/contract.dto';
import { SelectModule } from 'primeng/select';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { CreateCenterSubscribeDTO } from '../../models/centersubscribe/createCenterSubscribe.dto';
import { CheckComponent } from '../../shared/components/check-component/check-component.component';

@Component({
  standalone: true,
  selector: 'app-center-subscriber',
  imports: [
    ButtonModule,
    CommonModule,
    CardBaseComponent,
    InputTextModule,
    PasswordModule,
    FormsModule,
    ToastModule,
    DividerModule,
    IconFieldModule,
    InputIconModule,
    SelectModule,
    ConfirmDialog,
    CheckComponent
  ],
  templateUrl: './center-subscriber.component.html',
  styleUrl: './center-subscriber.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class CenterSubscriberComponent implements OnInit {
  clientId: string | null = null;
  cliente: Cliente | undefined;
  usuario: string | null = null;
  enable: boolean = false;
  changeButton: boolean = false;
  changeButtonCreate: boolean = false;
  changeButtonDisabled: boolean = false;
  changeButtonCreateDisabled: boolean = false;
  password: string | null = null;
  contracts: Contract[] = [];
  selectedContract: Contract | undefined;
  isLoading = false;
  tocarCheck = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private clientService: ClientService,
    private centerSubscribeService: CenterSubscribeService,
    private contractsService: ContractsService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit() {
    this.clientId = this.route.snapshot.paramMap.get('clientId');

    if (this.clientId) {
      this.carregarCliente(this.clientId);
      this.loadContracts(this.clientId);
      this.loadCredentials(this.clientId);
    }
  }

  loadCredentials(clientId: string) {
    this.centerSubscribeService.getCredentialsByClient(clientId).subscribe({
      next: (res: any) => {
        if (Array.isArray(res) && res.length > 0) {
          const credencial = res[0];

          this.usuario = credencial.Usuario || null;
          this.password = credencial.Senha || null;

          this.selectedContract = this.contracts.find(
            (c) => c.codeContractRbx === credencial.Contrato
          );
        } else {
          console.warn('Nenhuma credencial encontrada para o cliente.');
        }
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Cliente não possui central do assinante!',
        });
      },
    });
  }

  copyToClipboard(text: any, label: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Copiado!',
        detail: `${label} copiado com sucesso`,
        life: 2000,
      });
    });
  }

  navigateToInfoClient() {
    this.router.navigate(['/info', this.clientId]);
  }

  openExternalLink() {
    window.open('https://sistema.oai.com.br/app_login/index.php', '_blank');
  }

  carregarCliente(clientId: string) {
    this.clientService.getClientById(clientId).subscribe({
      next: (cliente) => {
        if (cliente.birthDate) {
          cliente.birthDate = new Date(cliente.birthDate);
          console.log(cliente.birthDate);
        }

        if (cliente.openingDate) {
          cliente.openingDate = new Date(cliente.openingDate);
        }

        this.cliente = cliente;
      },
      error: () => {
        console.error('Cliente não encontrado');
      },
    });
  }

  updateCredentialsClient() {
    this.confirmationService.confirm({
      message: 'Deseja realmente salvar as alterações?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '👍',
      rejectLabel: '👎',
      rejectButtonStyleClass: 'p-button-danger',

      accept: () => {
        this.saveCredentials();
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'A operação foi cancelada.',
        });
      },
    });
  }

  createCredentialsClient() {
    this.confirmationService.confirm({
      message: 'Deseja realmente salvar as alterações?',
      header: 'Confirmação',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: '👍',
      rejectLabel: '👎',
      rejectButtonStyleClass: 'p-button-danger',

      accept: () => {
        this.createCredentials();
      },
      reject: () => {
        this.messageService.add({
          severity: 'info',
          summary: 'Cancelado',
          detail: 'A operação foi cancelada.',
        });
      },
    });
  }

  changeAlterInputCreate() {
    this.enable = true;
    this.changeButtonCreate = true;
    this.changeButtonDisabled = true;
  }

  cancelCreateCredentials() {
    this.enable = false;
    this.changeButtonCreate = false;
    this.changeButtonDisabled = false;
  }

  changeAlterInputsCredentials() {
    this.enable = true;
    this.changeButton = true;
    this.changeButtonCreateDisabled = true;
  }

  cancelAlterCredentials() {
    this.enable = false;
    this.changeButton = false;
    this.changeButtonCreateDisabled = false;
  }

  loadContracts(clientId: string) {
    this.isLoading = true;
    this.contractsService.getContractsActivesByClient(clientId).subscribe({
      next: (res) => {
        this.contracts = res.map((contract) => ({
          ...contract,
          displayLabel: `${contract.codeContractRbx} - ${contract.planName}`,
        }));
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível carregar os contratos ativos',
        });
      },
    });
  }

  createCredentials() {
    const payload: CreateCenterSubscribeDTO = {
      clientCodeRbx: this.cliente?.codigoRbx,
      newPassword: this.password,
      contractCodeRbx: this.selectedContract?.codeContractRbx ?? null,
    };

    if (!this.usuario || !this.password || !this.selectedContract) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obrigatórios',
        detail: 'Preencha todos os campos antes de salvar.',
        life: 2500,
      });
      return;
    }

    if (this.password.length < 7 || this.usuario.length < 7) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Senha/usuario inválida',
        detail: 'A senha ou usuario deve conter no mínimo 7 caracteres.',
        life: 2500,
      });
      return;
    }

    this.centerSubscribeService.createCredentials(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Credenciais atualizadas com sucesso!',
        });

        this.tocarCheck = true;
        setTimeout(() => this.tocarCheck = false, 10);
        this.changeButtonDisabled = false;
      },
      error: (err) => {
        const errorMessage =
          err?.error?.message || 'Erro inesperado. Tente novamente mais tarde.';

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
        });
        this.changeButtonDisabled = false;
      },
    });

    this.enable = false;
    this.changeButtonCreate = false;
  }

  saveCredentials() {
    const payload: UpdateCenterSubscribeDTO = {
      clientCodeRbx: this.cliente?.codigoRbx,
      newPassword: this.password,
      contractCodeRbx: this.selectedContract?.codeContractRbx ?? null,
    };

    if (!this.usuario || !this.password || !this.selectedContract) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Campos obrigatórios',
        detail: 'Preencha todos os campos antes de salvar.',
        life: 2500,
      });
      return;
    }

    this.centerSubscribeService.updateCredentials(payload).subscribe({
      next: (res) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Credenciais atualizadas com sucesso!',
        });

        this.tocarCheck = true;
        setTimeout(() => this.tocarCheck = false, 10);
        this.changeButtonCreateDisabled = false;
      },
      error: (err) => {
        console.error('Erro ao atualizar credenciais:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível atualizar as credenciais.',
        });
        this.changeButtonCreateDisabled = false;
      },
    });

    this.enable = false;
    this.changeButton = false;
  }


}
