import { Component, ViewChild } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { DividerModule } from 'primeng/divider';
import { DatePickerModule } from 'primeng/datepicker';
import { FormsModule, NgModel } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { Router } from '@angular/router';
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';
import { Cliente } from '../../models/cliente/cliente.dto';
import { CepService } from '../../services/cep/cep.service';
import { NgForm } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ClientService } from '../../services/clients/client.service';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

@Component({
  selector: 'app-registerclient',
  imports: [
    CardBaseComponent,
    CommonModule,
    InputTextModule,
    ButtonModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    DividerModule,
    DatePickerModule,
    FormsModule,
    SelectModule,
    MessagesValidFormsComponent,
    NgxMaskDirective,
    ToastModule,
    ConfirmDialogModule,
  ],
  templateUrl: './registerclient.component.html',
  styleUrl: './registerclient.component.scss',
  providers: [MessageService, ConfirmationService],
})
export class RegisterclientComponent {
  constructor(
    private router: Router,
    private cepService: CepService,
    private messageService: MessageService,
    private clientService: ClientService,
    private confirmationService: ConfirmationService
  ) {}

  @ViewChild('clienteForm') clienteForm!: NgForm;

  cpfInvalido: boolean = false;
  cnpjInvalido: boolean = false;

  selectedOption: boolean = false;
  clientLocation: string | null = null;

  selectedClientType: 'PF' | 'PJ' = 'PF';

  cliente: Cliente = {
    name: '',
    cpf: '',
    rg: '',
    birthDate: undefined,
    socialName: '',
    fantasyName: '',
    typeContribuinte: '',
    cnpj: '',
    ie: '',
    openingDate: undefined,
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    uf: '',
    cidade: '',
    bairro: '',
    celular1: '',
    celular2: '',
    telefone: '',
    email: '',
    typeClient: '',
    typeZone: '',
  };

  selectedZoneType: 'Urbano' | 'Rural' = 'Urbano';
  zonatypes = [
    { label: 'Urbano', value: 'Urbano' },
    { label: 'Rural', value: 'Rural' },
  ];

  clientTypes = [
    { label: 'Pessoa Física', value: 'PF' },
    { label: 'Pessoa Jurídica', value: 'PJ' },
  ];

  typeContribuinte: string = '1';
  contribuinteTypes = [
    { label: 'Não Contribuinte', value: '9' },
    { label: 'Contribuinte', value: '1' },
    { label: 'Isento', value: '2' },
  ];

  cepNaoEncontrado: boolean = false;
  onCepChange(form: NgForm) {
    const cep = this.cliente.cep!.replace(/\D/g, '');
    if (cep.length === 8) {
      this.cepService.searchCEP(cep).subscribe({
        next: (data) => {
          if (!data.erro) {
            this.cepNaoEncontrado = false;

            this.cliente.rua = data.logradouro;
            this.cliente.bairro = data.bairro;
            this.cliente.cidade = data.localidade;
            this.cliente.complemento = data.complemento;
            this.cliente.uf = data.uf;

            form.form.patchValue({
              street: this.cliente.rua,
              neighborhood: this.cliente.bairro,
              city: this.cliente.cidade,
              complement: this.cliente.complemento,
              uf: this.cliente.uf,
            });
          } else {
            this.cepNaoEncontrado = true;
          }
        },
        error: () => (this.cepNaoEncontrado = true),
      });
    } else {
      this.cepNaoEncontrado = false;
    }
  }

  formatCpf(event: any, cpfControl: NgModel) {
    let value = event.target.value;
    value = value.replace(/\D/g, '').substring(0, 11);

    if (value.length > 9) {
      value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else if (value.length > 6) {
      value = value.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 3) {
      value = value.replace(/(\d{3})(\d{0,3})/, '$1.$2');
    }

    event.target.value = value;
    cpfControl.control.setValue(value);
  }

  formatRg(event: any, rgControl: NgModel) {
    let value = event.target.value;
    value = value.replace(/\D/g, '');
    value = value.substring(0, 9);
    if (value.length > 8) {
      value = value.replace(/(\d{2})(\d{3})(\d{3})(\d{0,1})/, '$1.$2.$3-$4');
    } else if (value.length > 5) {
      value = value.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
    } else if (value.length > 2) {
      value = value.replace(/(\d{2})(\d{0,3})/, '$1.$2');
    }
    event.target.value = value;
    rgControl.control.setValue(value);
  }

  formatCnpj(event: any, control: any) {
    let value = event.target.value;
    value = value.replace(/\D/g, '');
    if (value.length > 14) value = value.slice(0, 14);
    if (value.length > 2) value = value.replace(/^(\d{2})(\d)/, '$1.$2');
    if (value.length > 5)
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
    if (value.length > 8)
      value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
    if (value.length > 12)
      value = value.replace(
        /^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/,
        '$1.$2.$3/$4-$5'
      );
    control.control.setValue(value);
  }

  validCPF(cpf: string): boolean {
    cpf = cpf.replace(/\D/g, '');
    if (cpf.length !== 11) return false;

    let soma = 0,
      peso = 10;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf[i]) * peso--;
    }
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    (soma = 0), (peso = 11);
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf[i]) * peso--;
    }
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    return cpf[9] === digito1.toString() && cpf[10] === digito2.toString();
  }

  validCnpj(cnpj: string): boolean {
    cnpj = cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

    let peso1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let peso2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let soma = peso1.reduce((acc, val, i) => acc + parseInt(cnpj[i]) * val, 0);
    let digito1 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    soma = peso2.reduce((acc, val, i) => acc + parseInt(cnpj[i]) * val, 0);
    let digito2 = soma % 11 < 2 ? 0 : 11 - (soma % 11);

    return cnpj[12] === digito1.toString() && cnpj[13] === digito2.toString();
  }

  validateCpfInput(value: string) {
    this.cpfInvalido = value ? !this.validCPF(value) : false;
  }

  validateCnpjInput(value: string) {
    this.cnpjInvalido = value ? !this.validCnpj(value) : false;
  }

  goBack() {
    this.router.navigate(['/search']);
  }

  limparFormulario(form: NgForm) {
    form.resetForm();
  }

  confirmarCadastro(form: NgForm) {
    if (!this.clienteForm.valid) {
      this.messageService.add({
        summary: 'Inválido',
        detail: 'Preencha todos os campos obrigatórios!',
        severity: 'warn',
      });
      return;
    }

    this.confirmationService.confirm({
      header: 'Tem certeza?',
      message: 'Confirme para cadastrar o cliente.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cadastrar',
      rejectLabel: 'Cancelar',
      rejectButtonStyleClass: 'p-button-danger',
      acceptButtonStyleClass: 'p-button-success',
      accept: () => {
        this.executarCadastro(form);
      },
      reject: () => {
        this.messageService.add({
          severity: 'warn',
          summary: 'Cancelado',
          detail: 'Cadastro cancelado pelo usuário.',
        });
      },
    });
  }

  private executarCadastro(form: NgForm) {
    const clientePayload: Cliente = {
      typeClient: this.clienteForm.value.typeclient,
      name: this.clienteForm.value.nome,
      cpf: this.clienteForm.value.cpf,
      rg: this.clienteForm.value.rg,
      birthDate: this.clienteForm.value.dateOfBirth,
      socialName: this.clienteForm.value.razao,
      fantasyName: this.clienteForm.value.fantasia,
      cnpj: this.clienteForm.value.cnpj,
      typeContribuinte: this.clienteForm.value.typeContribuinte,
      ie: this.clienteForm.value.inscricao,
      openingDate: this.clienteForm.value.dateopen,
      cep: this.clienteForm.value.cep,
      rua: this.clienteForm.value.street,
      numero: this.clienteForm.value.number,
      complemento: this.clienteForm.value.complement,
      uf: this.clienteForm.value.uf,
      cidade: this.clienteForm.value.city,
      bairro: this.clienteForm.value.neighborhood,
      celular1: this.clienteForm.value.phone,
      celular2: this.clienteForm.value.phone2,
      telefone: this.clienteForm.value.telephone,
      email: this.clienteForm.value.email,
      typeZone: this.clienteForm.value.typezone,
    };

    this.clientService.createClient(clientePayload).subscribe({
      next: (response) => {
        this.messageService.add({
          summary: 'Sucesso',
          detail: 'Cliente cadastrado com sucesso!',
          severity: 'success',
        });
        if (response?.id)
          this.router.navigate(['/upload-pictures', response.id]);
        this.limparFormulario(form);
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          summary: 'Erro',
          detail: 'Falha ao cadastrar cliente.',
          severity: 'error',
        });
      },
    });
  }
}
