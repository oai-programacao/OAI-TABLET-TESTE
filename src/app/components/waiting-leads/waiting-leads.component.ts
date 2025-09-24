import { Component, inject } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { CommonModule } from '@angular/common';
import {  ButtonModule } from 'primeng/button';
import { CardLeadsComponent } from "../../shared/components/card-leads/card-leads.component";
import { Router } from '@angular/router';

export interface Sell {
  status?: string;
  planCode?: string;
  phone?: string;
  email?: string;
  address?: Address;
  leadSince?: string;
  observation?: string;
  font?: string;
}

export interface Address{
  street?: string;
  number?: string;
  neighborhood?: string;
  UF?: string;
}


@Component({
  selector: 'app-waiting-leads',
  imports: [CardBaseComponent, CommonModule, ButtonModule, CardLeadsComponent],
  templateUrl: './waiting-leads.component.html',
  styleUrl: './waiting-leads.component.scss'
})
export class WaitingLeadsComponent {


  private readonly router = inject(Router);

  cardStatusInterested: Sell = {
    status: 'Interessado',
    planCode: 'Ultra 300 Mbps OAI',
    phone: '(18) 99876-5432',
    email: 'carlos.silva@email.com',
    address:  {
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Vila Madalena',
      UF: 'SP'
    },
    leadSince: '10/09/2025',
    observation: 'Cliente interessado em migrar da concorrência. Quer desconto.',
    font: "Site"
  }
  
  
  cardStatusNogociation: Sell = {
    status: 'Negociando',
    planCode: 'Business 1GB',
    phone: '(18) 98765-4321',
    email: 'marina.costa@empresa.com',
    address: {
      street: 'Av. Paulista',
      number: '500',
      neighborhood: 'Bela Vista',
      UF: 'SP'
    },
    leadSince: '11/09/2025',
    observation: 'Empresa de 50 funcionários. Precisa de instalação urgente.',
    font: 'Indicação'
  }

  cardStatusNewClient: Sell = {
    status: "Novo",
    planCode: "Basic 100 Mbps OAI",
    phone: "(18) 97654-3210",
    email: "roberto.lima@gmail.com",
    address: {
      street: 'Rua Augusta',
      number: '789',
      neighborhood: 'Consolação',
      UF: 'SP'
    },
    leadSince: '',
    observation: '',
    font: 'Whatsapp' 
  }


  backToSearch() {
    this.router.navigate(['search']);
}



}
