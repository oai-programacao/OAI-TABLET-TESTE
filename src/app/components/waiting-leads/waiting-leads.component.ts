import { Component, inject, OnInit } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardLeadsComponent } from "../../shared/components/card-leads/card-leads.component";
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SalesService } from '../../services/sales/sales.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// ✅ Interfaces tipadas
export interface ArchivedSale {
  draftId: string;
  status: string;
  clientId: string;
  clientName: string;
  clientCpf?: string;
  clientPhone?: string;
  clientEmail?: string;
  leadSince?: string;
  codePlan?: number;
  planName?: string;
  observation?: string;
  address?: Address;
  archivedAt?: string;
  font?: string;
}

export interface Address {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  complement?: string;
}

@Component({
  selector: 'app-waiting-leads',
  standalone: true,
  imports: [
    CardBaseComponent,
    CommonModule,
    ButtonModule,
    CardLeadsComponent,
    ProgressSpinnerModule
  ],
  templateUrl: './waiting-leads.component.html',
  styleUrl: './waiting-leads.component.scss',
  providers: [MessageService],
})
export class WaitingLeadsComponent implements OnInit {

  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly salesService = inject(SalesService);

  archivedSales: ArchivedSale[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadArchivedSales();
  }

  /**
   * Carrega lista de vendas arquivadas
   */
  loadArchivedSales(): void {
    this.isLoading = true;

    this.salesService.getArchivedSales().subscribe({
      next: (sales: ArchivedSale[]) => {
        this.archivedSales = sales;
        this.isLoading = false;

        console.log('📦 Vendas arquivadas:', sales);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('❌ Erro ao buscar vendas arquivadas:', err);

        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Falha ao carregar vendas arquivadas.',
        });
      },
    });
  }

  
  convertToSale(sale: ArchivedSale): void {
  console.log('🔄 Convertendo venda:', sale);
  this.router.navigate(['/add-contract'], {
    queryParams: {
      clientId: sale.clientId,
      draftId: sale.draftId,
    },
  });
}

  
  callClient(phone: string): void {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  }

  sendEmail(email: string): void {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  }

  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR');
    } catch {
      return '-';
    }
  }

  backToSearch(): void {
    this.router.navigate(['search']);
  }
  
transformToCardData(sale: ArchivedSale): any {
  return {
    draftId: sale.draftId,
    clientId: sale.clientId,
    
    clientName: sale.clientName,
    email: sale.clientEmail || 'Email não informado',
    phone: sale.clientPhone || 'Telefone não informado',
  
    status: sale.status || 'ARQUIVADO',
    planCode: sale.planName || `Plano ${sale.codePlan || 'N/A'}`,
    
    address: sale.address ? {
      street: sale.address.street,
      number: sale.address.number,
      neighborhood: sale.address.neighborhood,
      UF: sale.address.state
    } : undefined,
    
    leadSince: this.formatDate(sale.leadSince),
    observation: sale.observation || '',
    font: sale.font || 'Sistema',
    archivedAt: this.formatDate(sale.archivedAt)
  };
}
}