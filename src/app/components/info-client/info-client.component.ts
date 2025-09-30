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

import { Router } from '@angular/router';
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
  isEditing = false;
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cepService = inject(CepService);

  tipoCliente: 'PF' | 'PJ' = 'PF';

  cliente: Cliente = {}; // Inicializa vazio

  ngOnInit(): void {
  const navigation = this.router.getCurrentNavigation();
  const clientResponse = navigation?.extras.state?.['cliente'];
  

  console.log('Objeto vindo do router:', clientResponse);
  
  if (clientResponse) {
    // Atualiza propriedades existentes do cliente DTO
    this.cliente.nome = clientResponse.name ?? '';
    this.cliente.cpf = clientResponse.cpf ?? '';
    this.cliente.rg = clientResponse.rg ?? '';
    this.cliente.nascimento = clientResponse.birthDate ?? '';
    this.cliente.tipoCliente = clientResponse.typeClient ?? 'PF';
    this.cliente.razaoSocial = clientResponse.socialName ?? '';
    this.cliente.nomeFantasia = clientResponse.fantasyName ?? '';
    this.cliente.cnpj = clientResponse.cnpj ?? '';
    this.cliente.ie = clientResponse.ie ?? '';
    this.cliente.cep = clientResponse.address?.zipCode ?? '';
    this.cliente.logradouro = clientResponse.address?.street ?? '';
    this.cliente.numero = clientResponse.address?.number ?? '';
    this.cliente.complemento = clientResponse.address?.complement ?? '';
    this.cliente.uf = clientResponse.address?.state ?? '';
    this.cliente.observacao = clientResponse.observation ?? '';
    this.cliente.celular1 = clientResponse.phone ?? '';
    this.cliente.celular2 = clientResponse.phone2 ?? '';
    this.cliente.telefone = clientResponse.telephone ?? '';
    this.cliente.email = clientResponse.email ?? '';
    this.cliente.ranking = clientResponse.ranking ?? '';

    // Define tipo PF/PJ
    this.tipoCliente = clientResponse.typeClient === 'PJ' ? 'PJ' : 'PF';
  }
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
            this.cliente.logradouro = dados.logradouro || '';
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
