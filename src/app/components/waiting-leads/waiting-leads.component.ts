import { Component, inject, OnInit } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardLeadsComponent } from '../../shared/components/card-leads/card-leads.component';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SalesService } from '../../services/sales/sales.service';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DraftSaleResponse } from '../../models/sales/draftSale.dto';

@Component({
  selector: 'app-waiting-leads',
  standalone: true,
  imports: [
    CardBaseComponent,
    CommonModule,
    ButtonModule,
    CardLeadsComponent,
    ProgressSpinnerModule,
  ],
  templateUrl: './waiting-leads.component.html',
  styleUrl: './waiting-leads.component.scss',
  providers: [MessageService],
})
export class WaitingLeadsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly saleService = inject(SalesService);

  archivedSales: DraftSaleResponse[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.loadArchivedSales();
  }

  loadArchivedSales(): void {
    this.isLoading = true;
    this.saleService.getArchivedSales().subscribe({
      next: (sales) => {
        if (Array.isArray(sales)) {
          sales.forEach((s, i) => console.log(`📦 Sale[${i}] =`, s));
        } else {
          console.warn('⚠️ A resposta NÃO é um array:', sales);
        }

        this.archivedSales = sales;
        console.log('📌 archivedSales armazenado:', this.archivedSales);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erro ao carregar vendas arquivadas', err);
        this.isLoading = false;
      },
    });
  }

  //deletar venda arquivada, assim é possível liberar espaço e também excluir vendas que não são mais necessárias.
  deleteSale(sale: DraftSaleResponse): void {
    const draftId = sale.draftId;

    if (!draftId) {
      console.error('❌ draftId não encontrado!');
      return;
    }

    this.saleService.deleteArchivedSale(draftId).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Removido',
          detail: 'Venda arquivada excluída com sucesso!',
        });

        this.archivedSales = this.archivedSales.filter(
          (s) => s.draftId !== sale.draftId
        );

        this.isLoading = false;
      },
      error: (err) => {
        console.error('❌ Erro ao excluir venda arquivada', err);
        this.isLoading = false;
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

  // passar para o card-leads os dados no formato esperado
  // pois o card-leads espera um objeto com uma estrutura específica
  // enquanto o DraftSaleResponse tem uma estrutura diferente
  // essa função faz a transformação dos dados
  // O cards-leads é um componente genérico que pode ser usado em vários contextos
  transformToCardData(sale: DraftSaleResponse) {
    return {
      archivedAt: sale.archivedAt,
      draftId: sale.draftId,
      clientName: sale.clientName,
      sellerName: sale.sellerName,

      planCode: sale.codePlan,
      planName: sale.namePlan,

      email: sale.clientEmail,
      phone: sale.clientPhone,
      observation: sale.observation,
      address: {
        street: sale.address?.street,
        number: sale.address?.number,
        neighborhood: sale.address?.neighborhood,
        UF: sale.address?.state,
      },
    };
  }

  get totalUniquePlans(): number {
    const planSet = new Set(this.archivedSales.map((s) => s.codePlan));
    return planSet.size;
  }

  get totalUniqueClients(): number {
    const clientSet = new Set(this.archivedSales.map((s) => s.clientId));
    return clientSet.size;
  }
}
