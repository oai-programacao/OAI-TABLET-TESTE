import { ButtonModule } from 'primeng/button';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputTextModule } from 'primeng/inputtext';
import { DividerModule } from 'primeng/divider';
import { InputMaskModule } from 'primeng/inputmask';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from '../../core/auth.service';

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
    ReactiveFormsModule,
    ToastModule,
  ],
  templateUrl: './searchclient.component.html',
  styleUrls: ['./searchclient.component.scss'],
  providers: [MessageService],
})
export class SearchclientComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  form!: FormGroup;

  badgeValue: number = 1;

  vendedorNome: string = 'Fulano De Tal';
  dataAtual: Date = new Date();
  horaAtual: Date = new Date();
  documento: string = '';

  ngOnInit() {
    this.vendedorNome = localStorage.getItem('nome') || 'Visitante';

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
    if (!this.form.valid) {
      this.messageService.add({
        summary: 'Inválido',
        detail: 'Documento Inválido!',
        severity: 'warn',
      });
      return;
    }

    this.messageService.add({
      summary: 'Sucesso',
      detail: 'Cliente Encontrado com Sucesso!',
      severity: 'success',
    });

    console.log('Consultando cliente:', this.documento);
  }

  verPlanos() {
    this.router.navigate(['plans']);
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

  navigateToLeads() {
    this.router.navigate(['waiting-leads']);
  }

  logout() {
    this.authService.logout();

    this.messageService.add({
      summary: 'Sucesso',
      detail: 'Usuário Desconectado com Sucesso!',
      severity: 'success',
      icon: 'pi-thumbs-up-fill',
    });

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 500);
  }

}
