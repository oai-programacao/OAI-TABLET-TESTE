import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

// Importações Corretas do PrimeNG (sem ...Module para componentes standalone)
import { StepperModule } from 'primeng/stepper'; // Stepper ainda é um módulo
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Textarea } from 'primeng/textarea';
import { Divider } from 'primeng/divider';
import { Select } from 'primeng/select';
import { Dialog } from 'primeng/dialog';
import { InputGroup } from 'primeng/inputgroup';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { IftaLabel } from 'primeng/iftalabel';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast'; // Toast é separado do ToastModule

// Importações de Terceiros e do seu App
import { NgxMaskDirective } from 'ngx-mask';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { MessagesValidFormsComponent } from "../../shared/components/message-valid-forms/message-valid-forms.component";

// Modelos e Serviços
import { Contract } from '../../models/contract/contract.dto';
import { AuthService } from '../../core/auth.service';
import { ContractsService } from '../../services/contracts/contracts.service';
import { CepResponse, CepService } from '../../services/cep/cep.service';


// Interface apenas para o formulário, mais limpa
export interface AddressForm {
  cep: string | null;
  street: string;
  numberFromHome: string | null;
  complement: string;
  uf: string;
  neighborhood: string;
  city: string;
  observation: string;
}

@Component({
  selector: 'app-address-transfer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardBaseComponent,
    StepperModule,
    InputText,
    Button,
    Textarea,
    Divider,
    Select,
    Dialog,
    InputGroup,
    InputGroupAddon,
    IftaLabel,
    NgxMaskDirective,
    MessagesValidFormsComponent,
    Toast
  
  ],
  providers: [MessageService],
  templateUrl: './address-transfer.component.html',
  styleUrls: ['./address-transfer.component.scss']
})
export class AddressTransferComponent implements OnInit {
  // --- INJEÇÕES E DECLARAÇÕES DE PROPRIEDADES ---
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);
  private readonly authService = inject(AuthService);
  private readonly contractsService = inject(ContractsService);

  public currentContract: Contract | null = null;
  public isLoading = false;
  public displayDialog = false;

  // --- FORMULÁRIOS ---
  public addressNewForm: AddressForm = {
    cep: null,
    street: '',
    numberFromHome: null,
    complement: '',
    uf: '',
    neighborhood: '',
    city: '',
    observation: ''
  };

  public paymentForm = {
    title: '',
    dueDate: '',
    price: ''
  };

  constructor(private cepService: CepService) {
    const navigation = this.router.getCurrentNavigation();

    if (navigation?.extras.state && navigation.extras.state['contractData']) {
      this.currentContract = navigation.extras.state['contractData'] as Contract;
      console.log('Dados do contrato recebidos:', this.currentContract);

      if(this.currentContract?.observation){
        this.addressNewForm.observation = this.currentContract.observation;
      }
    }
  }

  ngOnInit(): void {
    if (!this.currentContract) {
      console.error("Não foram recebidos dados do contrato. O usuário pode ter atualizado a página.");
    }
  }

 
  sendToAutomation(): void {
  if (!this.currentContract) {
    this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'Dados do contrato original não encontrados!' });
    return;
  }

  this.isLoading = true; 

  const sellerIdFromAuth = this.authService.getSellerId(); 

  const payload = {
  clientId: this.currentContract.clientId,
  sellerId: sellerIdFromAuth!.toString(),
  contractNumber: this.currentContract.codeContractRbx,
  newZip: this.addressNewForm.cep,
  newNumber: this.addressNewForm.numberFromHome,
  newComplement: this.addressNewForm.complement,
  newState: this.ufToNome(this.addressNewForm.uf), 
  newCity: this.addressNewForm.city,
  newStreet: this.addressNewForm.street,
  newNeighborhood: this.addressNewForm.neighborhood,
  observation: this.addressNewForm.observation || null,  
};

  console.log('Payload enviado:', payload);

  console.log('UF digitado:', this.addressNewForm.uf);
  console.log('Nome convertido:', this.ufToNome(this.addressNewForm.uf));
  this.contractsService.changeAddressContract(payload).subscribe({
    next: () => {
      this.isLoading = false;
      this.messageService.add({ severity: 'success', summary: 'Sucesso!', detail: 'Automação iniciada!' });
      this.router.navigate(['/client-contracts', this.currentContract?.clientId]);
    },
    error: (err) => {
      this.isLoading = false;
      const detailMessage = err?.error?.message || 'Falha ao iniciar a automação.';
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: detailMessage });
    }
  });
}


  btnToBack(): void {
    const clientId = this.currentContract?.clientId || this.route.snapshot.queryParamMap.get('fromClient');
    if (clientId) {
      this.router.navigate(['/client-contracts', clientId]);
    } else {
      this.router.navigate(['/search']);
    }
  }

  openDialog(): void {
    this.displayDialog = true;
  }

  closeDialog(): void {
    this.displayDialog = false;
  }

   ufToNome(uf: string): string {
  const mapa: Record<string, string> = {
    "AC": "Acre", "AL": "Alagoas", "AP": "Amapá", "AM": "Amazonas", "BA": "Bahia",
    "CE": "Ceará", "DF": "Distrito Federal", "ES": "Espírito Santo", "GO": "Goiás",
    "MA": "Maranhão", "MT": "Mato Grosso", "MS": "Mato Grosso do Sul", "MG": "Minas Gerais",
    "PA": "Pará", "PB": "Paraíba", "PR": "Paraná", "PE": "Pernambuco", "PI": "Piauí",
    "RJ": "Rio de Janeiro", "RN": "Rio Grande do Norte", "RS": "Rio Grande do Sul",
    "RO": "Rondônia", "RR": "Roraima", "SC": "Santa Catarina", "SP": "São Paulo",
    "SE": "Sergipe", "TO": "Tocantins"
  };
   return mapa[uf] || uf;
}

searchCEP(): void {
  if(!this.addressNewForm.cep) return;
  this.cepService.searchCEP(this.addressNewForm.cep).subscribe((res: CepResponse) => {
    if (res.erro) {
      this.messageService.add({ severity: 'error', summary: 'Erro', detail: 'CEP não encontrado.' });
      return;
    }
    this.addressNewForm.street = res.logradouro || '';
    this.addressNewForm.neighborhood = res.bairro || '';
    this.addressNewForm.city = res.localidade || '';
    this.addressNewForm.uf = res.uf || '';
    this.addressNewForm.complement = res.complemento || '';
  }
    );
  }
}


