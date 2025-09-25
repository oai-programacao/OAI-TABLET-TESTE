import { Component, inject } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardLeadsComponent } from "../../shared/components/card-leads/card-leads.component";
import { Router } from '@angular/router';

// As interfaces permanecem as mesmas
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

export interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  UF?: string;
}

@Component({
  selector: 'app-waiting-leads',
  standalone: true, // Adicionado para garantir que o componente funcione com 'imports'
  imports: [
    CardBaseComponent,
    CommonModule,
    ButtonModule,
    CardLeadsComponent
    // Removi o CarouselModule, já que você está criando um scroll manual
  ],
  templateUrl: './waiting-leads.component.html',
  styleUrl: './waiting-leads.component.scss'
})
export class WaitingLeadsComponent {

  private readonly router = inject(Router);

  // Array 'sells' com todos os seus dados
  sells: Sell[] = [
    {
      status: 'Interessado',
      planCode: 'Ultra 300 Mbps OAI',
      phone: '(18) 99876-5432',
      email: 'carlos.silva@email.com',
      address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Vila Madalena',
        UF: 'SP'
      },
      leadSince: '24/09/2025',
      observation: 'Cliente interessado em migrar da concorrência. Quer desconto.',
      font: "Site"
    },
    {
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
      leadSince: '23/09/2025',
      observation: 'Empresa de 50 funcionários. Precisa de instalação urgente.',
      font: 'Indicação'
    },
    {
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
      leadSince: '22/09/2025',
      observation: 'Primeiro contato realizado, aguardando retorno.',
      font: 'Whatsapp'
    },
    {
      status: "Novo",
      planCode: "Gamer 500 Mbps",
      phone: "(18) 98877-1122",
      email: "juliana.souza@email.com",
      address: {
        street: 'Rua dos Pinheiros',
        number: '456',
        neighborhood: 'Pinheiros',
        UF: 'SP'
      },
      leadSince: '21/09/2025',
      observation: 'Solicitou informações sobre latência e IP fixo.',
      font: 'Formulário Site'
    },
    {
      status: "Interessado",
      planCode: "Ultra 300 Mbps OAI",
      phone: "(18) 97766-2233",
      email: "fernando.gomes@outlook.com",
      address: {
        street: 'Alameda Santos',
        number: '1800',
        neighborhood: 'Jardins',
        UF: 'SP'
      },
      leadSince: '20/09/2025',
      observation: 'Verificar viabilidade técnica no endereço.',
      font: 'Telefone'
    },
    {
      status: "Negociando",
      planCode: "Business 1GB",
      phone: "(18) 96655-3344",
      email: "contato@padariadoze.com.br",
      address: {
        street: 'Rua Frei Caneca',
        number: '321',
        neighborhood: 'Cerqueira César',
        UF: 'SP'
      },
      leadSince: '19/09/2025',
      observation: 'Enviada proposta comercial. Aguardando aprovação da diretoria.',
      font: 'Indicação'
    },
    {
      status: "Novo",
      planCode: "Basic 100 Mbps OAI",
      phone: "(18) 95544-4455",
      email: "ana.pereira@yahoo.com",
      address: {
        street: 'Rua da Mooca',
        number: '2000',
        neighborhood: 'Mooca',
        UF: 'SP'
      },
      leadSince: '18/09/2025',
      observation: '',
      font: 'Whatsapp'
    }
  ];

  backToSearch() {
    this.router.navigate(['search']);
  }
}