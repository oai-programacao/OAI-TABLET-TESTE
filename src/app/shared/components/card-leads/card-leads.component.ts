import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ButtonModule } from 'primeng/button';


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
  selector: 'app-card-leads',
  imports: [CommonModule, ButtonModule],
  templateUrl: './card-leads.component.html',
  styleUrl: './card-leads.component.scss'
})
export class CardLeadsComponent {
 @Input() data!: Sell;
}
