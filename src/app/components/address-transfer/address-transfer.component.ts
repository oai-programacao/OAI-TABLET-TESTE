import { Component, inject } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { StepperModule } from 'primeng/stepper';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { DividerModule } from 'primeng/divider';
import { SelectModule } from 'primeng/select';
import { Router, ActivatedRoute } from '@angular/router';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { FormsModule } from '@angular/forms';
import { NgxMaskDirective } from 'ngx-mask';
import { MessagesValidFormsComponent } from "../../shared/components/message-valid-forms/message-valid-forms.component";

export interface AddressNew {
  cep: number | null;
  street: string;
  numberFromHome: number | null;
  complement: string;
  uf: string;
  observation: string;
}

@Component({
  selector: 'app-address-transfer',
  standalone: true,
  imports: [
    CardBaseComponent,
    StepperModule,
    CommonModule,
    InputTextModule,
    ButtonModule,
    TextareaModule,
    DividerModule,
    SelectModule,
    IftaLabelModule,
    InputGroupModule,
    InputGroupAddonModule,
    FormsModule,
    NgxMaskDirective,
    MessagesValidFormsComponent
  ],
  templateUrl: './address-transfer.component.html',
  styleUrls: ['./address-transfer.component.scss']
})
export class AddressTransferComponent {
  private originClientId: string | null = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);


  ngOnInit(): void {
    this.originClientId = this.route.snapshot.queryParamMap.get('fromClient');
  }

  // formulário de endereço
  addressNewForm: AddressNew = {
    cep: null,
    street: '',
    numberFromHome: null,
    complement: '',
    uf: '',
    observation: ''
  };

  // formulário de contrato
  contractForm :any = {
    contract: '',
    observation: ''
  };

  // formulário de pagamento
  paymentForm: any = {
    title: '',
    dueDate: '',
    price: ''
  };

  methodPayment = [
    { label: 'Cartão de Crédito', value: 'cartao' },
    { label: 'Boleto', value: 'boleto' },
    { label: 'Pix', value: 'pix' }
  ];

  backToContract() {
    this.router.navigate(['client-contract']);
  }

  submitContract() {
    console.log('📑 Dados do contrato:', this.contractForm);
  }

  submitPayment() {
    console.log('💰 Dados do pagamento:', this.paymentForm);
  }

  btnToBack(): void{
    if(this.originClientId){
      this.router.navigate(['client-contracts', this.originClientId]);
    }else{
      console.error('ID do cliente de origem não encontrado.');
      this.router.navigate(['client-contracts']);
    }
  }
}
