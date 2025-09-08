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
import { ClienteDTO } from '../../models/cliente.dto';
import { CepService } from '../../services/cep.service';
import { NgForm } from '@angular/forms';

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
  ],
  templateUrl: './registerclient.component.html',
  styleUrl: './registerclient.component.scss',
})
export class RegisterclientComponent {
  constructor(private router: Router, private cepService: CepService) {}

  dateOfBirth: Date | null = null;
  selectedOption: boolean = false;
  clientLocation: string | null = null;

  selectedClientType: 'PF' | 'PJ' = 'PF';
  clienteDTO: ClienteDTO = {
    tipoCliente: 'PF',
  };

  clientTypes = [
    { label: 'Pessoa Física', value: 'PF' },
    { label: 'Pessoa Jurídica', value: 'PJ' },
  ];

  endereco: any = {
    cep: '',
    rua: '',
    bairro: '',
    cidade: '',
    complemento: '',
  };

  cepNaoEncontrado: boolean = false;
  onCepChange(form: NgForm) {
    const cep = this.endereco.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      this.cepService.searchCEP(cep).subscribe({
        next: (data) => {
          if (!data.erro) {
            this.cepNaoEncontrado = false;

            this.endereco.rua = data.logradouro;
            this.endereco.bairro = data.bairro;
            this.endereco.cidade = data.localidade;
            this.endereco.complemento = data.complemento;

            form.form.patchValue({
              rua: this.endereco.rua,
              bairro: this.endereco.bairro,
              cidade: this.endereco.cidade,
              complemento: this.endereco.complemento,
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

  formatCep(event: Event) {
    const input = event.target as HTMLInputElement;

    let value = input.value.replace(/\D/g, '');

    if (value.length > 5) {
      value = value.substring(0, 5) + '-' + value.substring(5, 8);
    }

    input.value = value;
    this.endereco.cep = value;
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

  goBack() {
    this.router.navigate(['/search']);
  }
}
