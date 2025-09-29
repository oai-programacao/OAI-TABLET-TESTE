import { Component } from '@angular/core';
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
import { ClienteDTO } from '../../models/cliente/cliente.dto';
import { CepService } from '../../services/cep/cep.service';
import { NgForm } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';

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
  ],
  templateUrl: './registerclient.component.html',
  styleUrl: './registerclient.component.scss',
})
export class RegisterclientComponent {
  constructor(private router: Router, private cepService: CepService) {}

  cpfInvalido: boolean = false;
  cnpjInvalido: boolean = false;

  dateOfBirth: Date | null = null;
  selectedOption: boolean = false;
  clientLocation: string | null = null;

  selectedClientType: 'PF' | 'PJ' = 'PF';
  clienteDTO: ClienteDTO = {
    tipoCliente: 'PF',
  };

  selectedZoneType: 'Urbana' | 'Rural' = 'Urbana';
  zonatypes = [
    { label: 'Urbana', value: 'Urbana' },
    { label: 'Rural', value: 'Rural' },
  ];

  clientTypes = [
    { label: 'Pessoa Física', value: 'PF' },
    { label: 'Pessoa Jurídica', value: 'PJ' },
  ];

  address: any = {
    cep: '',
    street: '',
    neighborhood: '',
    city: '',
    complemento: '',
    uf: '',
  };

  cepNaoEncontrado: boolean = false;
  onCepChange(form: NgForm) {
    const cep = this.address.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      this.cepService.searchCEP(cep).subscribe({
        next: (data) => {
          if (!data.erro) {
            this.cepNaoEncontrado = false;

            this.address.street = data.logradouro;
            this.address.neighborhood = data.bairro;
            this.address.city = data.localidade;
            this.address.complement = data.complemento;
            this.address.uf = data.uf;

            form.form.patchValue({
              street: this.address.street,
              neighborhood: this.address.neighborhood,
              city: this.address.city,
              complement: this.address.complement,
              uf: this.address.uf,
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
}
