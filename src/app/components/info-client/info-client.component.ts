import { ClientService } from './../../services/clients/client.service';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Components
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';

// PrimeNG
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IftaLabelModule } from 'primeng/iftalabel';
import { DatePickerModule } from 'primeng/datepicker';
import { ToastModule } from 'primeng/toast';

import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CepService } from '../../services/cep/cep.service';
import { NgxMaskDirective } from 'ngx-mask';
import { Cliente } from '../../models/cliente/cliente.dto';

@Component({
  selector: 'app-info-client',
  imports: [
    CommonModule,
    FormsModule,
    CardBaseComponent,
    DividerModule,
    InputTextModule,
    TextareaModule,
    ButtonModule,
    AvatarModule,
    MessagesValidFormsComponent,
    FloatLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    IftaLabelModule,
    NgxMaskDirective,
    DatePickerModule,
    ToastModule,
  ],
  templateUrl: './info-client.component.html',
  styleUrls: ['./info-client.component.scss'],
  providers: [MessageService],
})
export class InfoClientComponent implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cepService = inject(CepService);
  private readonly clientService = inject(ClientService);
  private readonly route = inject(ActivatedRoute);

  isEditing = false;

  tipoCliente: 'PF' | 'PJ' = 'PF';

  cliente: Cliente = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const clientId = params.get('clienteId');
      if (clientId) {
        this.carregarCliente(clientId);
      }
    });
  }

  carregarCliente(clientId: string) {
    this.clientService.getClientById(clientId).subscribe({
      next: (cliente) => {
        if (cliente.birthDate) {
          cliente.birthDate = new Date(cliente.birthDate); // o datepicker espera um objeto e não string
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

  navigateToContractClient() {
    this.router.navigate(['client-contract']);
  }

  toggleEditing() {
    this.isEditing = !this.isEditing;
  }

  saveCliente() {
    console.log('Cliente salvo:', this.cliente);

    this.messageService.add({
      severity: 'success',
      summary: 'Successo!',
      detail: 'Alterações salvas com sucesso!',
    });

    this.isEditing = false;
  }

  btnToBack() {
    this.router.navigate(['search']);
  }

  searchCEP() {
    const cep = this.cliente.cep?.replace(/\D/g, '');
    if (cep?.length === 8) {
      this.cepService.searchCEP(cep).subscribe({
        next: (dados) => {
          if (!dados.erro) {
            this.cliente.rua = dados.rua || '';
            this.cliente.uf = dados.uf || '';
            this.cliente.complemento = dados.complemento || '';
          } else {
            console.log('CEP não encontrado');
          }
        },
        error: (err) => console.log('Erro ao buscar CEP', err),
      });
    }
  }
}
