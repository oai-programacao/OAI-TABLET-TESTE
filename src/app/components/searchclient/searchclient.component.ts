import { ButtonModule } from 'primeng/button';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-searchclient',
  imports: [
    CardBaseComponent,
    IftaLabelModule,
    ButtonModule,
    CommonModule,
    FormsModule,
    InputTextModule,
    DividerModule
  ],
  templateUrl: './searchclient.component.html',
  styleUrls: ['./searchclient.component.scss'],
})
export class SearchclientComponent implements OnInit {
  vendedorNome: string = 'Gabriel Santos'; // pode vir de authService
  dataAtual: Date = new Date();
  horaAtual: Date = new Date();
  cpf: string = '';

  ngOnInit() {
    setInterval(() => {
      this.horaAtual = new Date();
    }, 1000);
  }

  consultarCliente() {
    console.log('Consultando cliente:', this.cpf);
    // chamada para API futura
  }

  verPlanos() {
    console.log('Redirecionar para planos...');
  }
}
