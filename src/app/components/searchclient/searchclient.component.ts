import { SearchclientService } from './../../services/searchclient/searchclient.service';
import { ButtonModule } from 'primeng/button';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  NgForm,
  ReactiveFormsModule,
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
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';

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
    MessagesValidFormsComponent,
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
  private readonly searchClientService = inject(SearchclientService);

  @ViewChild('searchClientForm') form!: NgForm;

  badgeValue: number = 1;

  vendedorNome: string = '';
  dataAtual: Date = new Date();
  horaAtual: Date = new Date();
  documento: string = '';

  clienteEncontrado: any = null;

  ngOnInit() {
    this.vendedorNome = localStorage.getItem('name') || 'Visitante';

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

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  //*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-
  //  FUNÇÃO PARA BUSCAR O CLIENTE E IMPORTAR.
  waitApiInsert: boolean = false;
  isLoading: boolean = false;

  async consultarCliente() {
    if (this.waitApiInsert) return; // previne múltiplos cliques
    if (!this.form.valid) {
      this.messageService.add({
        summary: 'Inválido',
        detail: 'Documento Inválido!',
        severity: 'warn',
      });
      return;
    }

    this.waitApiInsert = true;
    this.isLoading = true; // ativa spinner

    try {
      const response: any = await this.searchClientService
        .searchAndRegisterClient(this.documento)
        .toPromise();

      if (response.foundInPGDO && response.foundInRBX) {
        this.messageService.add({
          summary: 'Sucesso',
          detail: 'Cliente encontrado e sincronizado!',
          severity: 'success',
        });
        this.clienteEncontrado = response.client;
        await this.sleep(1500);
        this.router.navigate(['/info', this.clienteEncontrado.id]);
      } else if (response.foundInRBX && !response.foundInPGDO) {
        this.messageService.add({
          summary: 'Cadastro',
          detail: 'Cliente presente apenas no RBX, mas foi cadastrado no PGDO!',
          severity: 'info',
          icon: 'pi-arrow-circle-down',
        });
        this.clienteEncontrado = response.client ?? null;
        await this.sleep(1500);
        this.router.navigate(['/info', this.clienteEncontrado.id]);
      } else {
        this.messageService.add({
          summary: 'AVISO',
          detail:
            'Cliente não encontrado em nossa base dados, redirecionando pro cadastro!',
          severity: 'warn',
          icon: 'pi-info-circle',
        });
        await this.sleep(1500);
        this.router.navigate(['/register']);
      }
    } catch (err) {
      this.messageService.add({
        summary: 'Erro',
        detail: 'Erro ao buscar cliente.',
        severity: 'error',
      });
      console.error(err);
    } finally {
      this.waitApiInsert = false;
      this.isLoading = false;
    }
  }

  // *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-

  verPlanos() {
    this.router.navigate(['plans']);
  }

  navigateToLeads() {
    this.router.navigate(['waiting-leads']);
  }

  navigateToConcludeSale(){
    this.router.navigate(['conclude']);
  }

  formatarDocumento(valor: string) {
    if (!valor) {
      this.documento = '';
      return;
    }

    let digits = valor.replace(/\D/g, '').slice(0, 14);

    if (digits.length <= 11) {
      // CPF
      this.documento = digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ
      this.documento = digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    }
  }

  allowOnlyNumbers(event: KeyboardEvent) {
    const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Delete', 'Tab'];
    if (allowed.includes(event.key)) return;

    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent) {
    const pasted = event.clipboardData?.getData('text') ?? '';
    const digits = pasted.replace(/\D/g, '');
    if (!digits) {
      event.preventDefault();
      return;
    }

    // impede colagem direta (vamos gerenciar o valor)
    event.preventDefault();

    const input = event.target as HTMLInputElement;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;

    // pega os dígitos atuais, sem máscara
    const currentDigits = (input.value.replace(/\D/g, '') || '').slice(0, 14);

    const before = currentDigits.slice(
      0,
      start
        ? start - (input.value.slice(0, start).match(/\D/g) || []).length
        : 0
    );
    const after = currentDigits.slice(
      end ? end - (input.value.slice(0, end).match(/\D/g) || []).length : 0
    );

    const newDigits = (before + digits + after).slice(0, 14);

    this.formatarDocumento(newDigits);
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
