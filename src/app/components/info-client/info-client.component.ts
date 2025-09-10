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
import { CepService } from '../../services/cep.service';

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
    IftaLabelModule
  ],
  templateUrl: './info-client.component.html',
  styleUrls: ['./info-client.component.scss']
})
export class InfoClientComponent {
  isEditing = false;

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

  toggleEditing() {
    this.isEditing = !this.isEditing;
  }

  saveCliente() {
    console.log('Cliente salvo:', this.cliente);
    this.isEditing = false;
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
