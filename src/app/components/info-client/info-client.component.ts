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
import { MenuItem } from 'primeng/api';
import { Menu } from 'primeng/menu';

import { Router, ActivatedRoute } from '@angular/router';
import { MessageService } from 'primeng/api';
import { CepService } from '../../services/cep/cep.service';
import { NgxMaskDirective } from 'ngx-mask';
import { Cliente } from '../../models/cliente/cliente.dto';
import { OverlayModule } from 'primeng/overlay';

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
    OverlayModule,
    Menu,
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
  rankingOverlayVisible = false;
  isLoading = false;
  tipoCliente: 'PF' | 'PJ' = 'PF';

  items: MenuItem[] | undefined;

  cliente: Cliente = {};

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const clientId = params.get('clientId');
      if (clientId) {
        this.carregarCliente(clientId);
      }
    });

    this.items = [
      {
        label: 'Relacionados',
        items: [
          {
            label: 'Atendimentos',
            icon: 'pi pi-paperclip',
            command: () => this.navigateToAttendances()
          },
        ],
      },
      // {
      //   label: 'Extras',
      //   items: [
      //     {
      //       label: 'Settings',
      //       icon: 'pi pi-cog',
      //     },
      //   ],
      // },
    ];
  }

  carregarCliente(clientId: string) {
    this.clientService.getClientById(clientId).subscribe({
      next: (cliente) => {

        if (cliente.birthDate) {
          cliente.birthDate = new Date(cliente.birthDate);
          console.log(cliente.birthDate)
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
    this.router.navigate(['client-contracts', this.cliente.id]);
  }

  navigateToAttendances() {
    this.router.navigate([`/attendances/${this.cliente.id}`]);
  }

  toggleEditing() {
    if(this.isLoading){
      return;
    }
    this.isEditing = !this.isEditing;
  }

  saveCliente() {
  if (!this.cliente.id) {
    console.error('ID do cliente não encontrado, impossível salvar.');
    return;
  }

  this.isLoading = true;

  this.clientService.updateClient(this.cliente.id, this.cliente).subscribe({
    next: (clienteAtualizado) => {

      if (clienteAtualizado.birthDate) {
        clienteAtualizado.birthDate = new Date(clienteAtualizado.birthDate);
      }

      if (clienteAtualizado.openingDate) {
        clienteAtualizado.openingDate = new Date(clienteAtualizado.openingDate);
      }

      this.cliente = clienteAtualizado;

      this.messageService.add({
        severity: 'success',
        summary: 'Sucesso!',
        detail: 'Alterações salvas com sucesso!',
      });

      this.isEditing = false;
      this.isLoading = false;
    },
    error: (err) => {
      console.error('Erro ao salvar cliente:', err);
      this.messageService.add({
        severity: 'error',
        summary: 'Erro!',
        detail: 'Não foi possível salvar as alterações. Tente novamente.',
      });
      this.isLoading = false;
    },
  });
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
            this.cliente.rua = dados.logradouro|| '';
            this.cliente.cidade = dados.localidade || '';
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

  navigateToPhotosClient() {
    if (this.cliente?.id) {
      this.router.navigate(['/pictures-client', this.cliente.id]);
    } else {
      this.messageService.add({
        severity: 'warn',
        summary: 'Aviso', 
        detail: 'ID do cliente não encontrado!',
      });
    }
  }

  sendWhatsapp() {
    if (!this.cliente?.celular1) {
      alert('Número do cliente não encontrado!');
      return;
    }

    const numero = this.cliente.celular1.replace(/\D/g, '');

    const mensagem = encodeURIComponent(`Olá ${this.cliente.name}, tudo bem?`);

    const url = `https://wa.me/${numero}?text=${mensagem}`;

    window.open(url, '_blank');
  }


}
