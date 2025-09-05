import { ButtonModule } from 'primeng/button';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';

@Component({
  selector: 'app-searchclient',
  imports: [
    CardBaseComponent,
    IftaLabelModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    DividerModule,
    InputMaskModule,
  ],
  templateUrl: './searchclient.component.html',
  styleUrls: ['./searchclient.component.scss'],
})
export class SearchclientComponent implements OnInit {
  vendedorNome: string = 'Gabriel Santos'; // pode vir de authService
  dataAtual: Date = new Date();
  horaAtual: Date = new Date();
  documento: string = '';

  ngOnInit() {
    setInterval(() => {
      this.horaAtual = new Date();
    }, 1000);
  }

  infoVendas = [
    { label: 'Clientes atendidos hoje', value: 12 },
    { label: 'Novos contratos fechados', value: 5 },
    { label: 'Faturamento do dia', value: 'R$ 2.350,00' },
    { label: 'Meta mensal', value: '24 / 50' },
  ];

  //métodos e lógicas

  consultarCliente() {
    console.log('Consultando cliente:', this.documento);
    // chamada para API futura
  }

  verPlanos() {
    console.log('Redirecionar para planos...');
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    // permite apenas números (0-9)
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  onDocumentoChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace(/\D/g, '');

    if (digits.length <= 11) {
      this.documento = digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      this.documento = digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  }
}
