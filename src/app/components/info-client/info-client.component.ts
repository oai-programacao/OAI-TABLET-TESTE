// ANGULAR
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

//COMPONENTS
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { MessagesValidFormsComponent } from '../../shared/components/message-valid-forms/message-valid-forms.component';

// PRIMENG
import { DividerModule } from 'primeng/divider';
import { AvatarModule } from 'primeng/avatar';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { IftaLabelModule } from 'primeng/iftalabel';
import { CepService } from '../../services/cep/cep.service';
import { NgxMaskDirective } from 'ngx-mask';
import { DatePickerModule } from 'primeng/datepicker';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

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
    ToastModule
  ],
  templateUrl: './info-client.component.html',
  styleUrls: ['./info-client.component.scss'],
  providers: [MessageService]
})
export class InfoClientComponent {
  isEditing = false;
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);
  private readonly cepService = inject(CepService);


  // PF ou PJ
  tipoCliente: 'PF' | 'PJ' = 'PF';

  cliente = {
    // PF
    nome: '',
    cpf: '',
    rg: '',
    nascimento: '',

    // PJ
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    ie: '',

    // Endereço e contato
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    uf: '',
    observacao: '',
    celular1: '',
    celular2: '',
    telefone: '',
    email: ''
  };

  navigateToContractClient(){
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
      detail: 'Alterações salvas com sucesso!'
    })
    this.isEditing = false;
  }

   btnToBack(){
    this.router.navigate(['search'])
  }

  searchCEP(){
    const cep = this.cliente.cep?.replace(/\D/g, '');
    if(cep?.length === 8){
      this.cepService.searchCEP(cep).subscribe({
        next: (dados) => {
          if(!dados.erro){
            this.cliente.logradouro = dados.logradouro || '';
            this.cliente.uf = dados.uf || '';
            this.cliente.complemento = dados.complemento || '';
          } else{
            console.log('CEP não encontrado');
          }
          
        },
        error: (err) => console.log('Erro ao buscar CEP',err)
      })
    }
  }
}
