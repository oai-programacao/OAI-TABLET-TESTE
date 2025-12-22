import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface InternetPlan {
  id: number;
  name: string;
  speed: string;
  price: number;
  category: string;
}

interface Salesperson {
  id: number;
  name: string;
  avatar: string;
  team: string;
  email: string;
  salesCount?: number;
  revenue?: number;
  avgTicket?: number;
  monthlyData?: Array<{ month: string; count: number; revenue: number }>;
}

interface Sale {
  id: number;
  salespersonId: number;
  salespersonName: string;
  planId: number;
  planName: string;
  planSpeed: string;
  price: number;
  date: Date;
  customerName: string;
  status: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-panel.component.html',
  styleUrls: ['./sales-panel.component.scss'],
})
export class ConcludeSaleComponent implements OnInit {
  timeFilter: string = 'all';
  activeTab: string = 'performance';
  currentPage: number = 1;
  itemsPerPage: number = 10;

  stats = {
    totalRevenue: 0,
    totalSales: 0,
    avgTicket: 0,
    ranking: [] as Salesperson[],
  };

  mockSales: Sale[] = [];
  filteredSales: Sale[] = [];

  internetPlans: InternetPlan[] = [
    {
      id: 1,
      name: '50 Mbps Básico',
      speed: '50 Mbps',
      price: 79.9,
      category: 'basic',
    },
    {
      id: 2,
      name: '100 Mbps Intermediário',
      speed: '100 Mbps',
      price: 99.9,
      category: 'intermediate',
    },
    {
      id: 3,
      name: '200 Mbps Avançado',
      speed: '200 Mbps',
      price: 129.9,
      category: 'advanced',
    },
    {
      id: 4,
      name: '300 Mbps Premium',
      speed: '300 Mbps',
      price: 159.9,
      category: 'premium',
    },
    {
      id: 5,
      name: '500 Mbps Ultra',
      speed: '500 Mbps',
      price: 199.9,
      category: 'premium',
    },
    {
      id: 6,
      name: '1 Gbps Empresarial',
      speed: '1 Gbps',
      price: 299.9,
      category: 'business',
    },
  ];

  salespeople: Salesperson[] = [
    {
      id: 1,
      name: 'Carlos Silva',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
      team: 'Vendas SP',
      email: 'carlos.silva@empresa.com',
    },
    {
      id: 2,
      name: 'Ana Paula Santos',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
      team: 'Vendas RJ',
      email: 'ana.santos@empresa.com',
    },
    {
      id: 3,
      name: 'Roberto Oliveira',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
      team: 'Vendas SP',
      email: 'roberto.oliveira@empresa.com',
    },
    {
      id: 4,
      name: 'Juliana Costa',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Juliana',
      team: 'Vendas MG',
      email: 'juliana.costa@empresa.com',
    },
    {
      id: 5,
      name: 'Fernando Almeida',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fernando',
      team: 'Vendas RJ',
      email: 'fernando.almeida@empresa.com',
    },
    {
      id: 6,
      name: 'Patrícia Rocha',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia',
      team: 'Vendas SP',
      email: 'patricia.rocha@empresa.com',
    },
    {
      id: 7,
      name: 'Lucas Mendes',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lucas',
      team: 'Vendas MG',
      email: 'lucas.mendes@empresa.com',
    },
    {
      id: 8,
      name: 'Mariana Ferreira',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mariana',
      team: 'Vendas RJ',
      email: 'mariana.ferreira@empresa.com',
    },
  ];

  ngOnInit() {
    this.generateSales();
    this.calculateStats();
    this.filterSales();
  }

  generateSales() {
    const startDate = new Date('2024-01-01');
    const endDate = new Date();

    this.salespeople.forEach((salesperson) => {
      const numSales = Math.floor(Math.random() * 25) + 15;

      for (let i = 0; i < numSales; i++) {
        const randomDate = new Date(
          startDate.getTime() +
            Math.random() * (endDate.getTime() - startDate.getTime())
        );

        const plan =
          this.internetPlans[
            Math.floor(Math.random() * this.internetPlans.length)
          ];

        this.mockSales.push({
          id: this.mockSales.length + 1,
          salespersonId: salesperson.id,
          salespersonName: salesperson.name,
          planId: plan.id,
          planName: plan.name,
          planSpeed: plan.speed,
          price: plan.price,
          date: randomDate,
          customerName: `Cliente ${this.mockSales.length + 1}`,
          status: Math.random() > 0.1 ? 'completed' : 'pending',
        });
      }
    });

    this.mockSales.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  calculateStats() {
    this.stats.totalRevenue = this.mockSales
      .filter((s) => s.status === 'completed')
      .reduce((sum, sale) => sum + sale.price, 0);

    this.stats.totalSales = this.mockSales.filter(
      (s) => s.status === 'completed'
    ).length;

    const salesByPerson = this.salespeople.map((person) => {
      const personSales = this.mockSales.filter(
        (s) => s.salespersonId === person.id && s.status === 'completed'
      );

      const revenue = personSales.reduce((sum, sale) => sum + sale.price, 0);
      const count = personSales.length;
      const avgTicket = count > 0 ? revenue / count : 0;

      const monthlyData = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthSales = personSales.filter((s) => {
          const saleMonth = new Date(
            s.date.getFullYear(),
            s.date.getMonth(),
            1
          );
          return saleMonth.getTime() === month.getTime();
        });
        monthlyData.push({
          month: month.toLocaleDateString('pt-BR', { month: 'short' }),
          count: monthSales.length,
          revenue: monthSales.reduce((sum, s) => sum + s.price, 0),
        });
      }

      return {
        ...person,
        salesCount: count,
        revenue: revenue,
        avgTicket: avgTicket,
        monthlyData: monthlyData,
      };
    });

    this.stats.ranking = salesByPerson.sort(
      (a, b) => (b.revenue || 0) - (a.revenue || 0)
    );
    this.stats.avgTicket =
      this.stats.totalSales > 0
        ? this.stats.totalRevenue / this.stats.totalSales
        : 0;
  }

  filterSales() {
    const now = new Date();

    switch (this.timeFilter) {
      case 'today':
        this.filteredSales = this.mockSales.filter((s) => {
          const saleDate = new Date(s.date);
          return saleDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        this.filteredSales = this.mockSales.filter(
          (s) => new Date(s.date) >= weekAgo
        );
        break;
      case 'month':
        this.filteredSales = this.mockSales.filter((s) => {
          const saleDate = new Date(s.date);
          return (
            saleDate.getMonth() === now.getMonth() &&
            saleDate.getFullYear() === now.getFullYear()
          );
        });
        break;
      default:
        this.filteredSales = this.mockSales;
    }
  }

  setTimeFilter(filter: string) {
    this.timeFilter = filter;
    this.filterSales();
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  get top3() {
    return this.stats.ranking.slice(0, 3);
  }

  get others() {
    return this.stats.ranking.slice(3);
  }

  get paginatedSales() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredSales.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredSales.length / this.itemsPerPage);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  getProgressPercent(revenue: number): number {
    const maxRevenue = Math.max(
      ...this.stats.ranking.map((s) => s.revenue || 0)
    );
    return maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  }

  getSalesperson(id: number) {
    return this.salespeople.find((s) => s.id === id);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  getEndIndex(): number {
    return Math.min(
      this.currentPage * this.itemsPerPage,
      this.filteredSales.length
    );
  }
}
