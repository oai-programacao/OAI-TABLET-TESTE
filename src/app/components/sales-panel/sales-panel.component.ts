import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';
import { Divider } from 'primeng/divider';
import { Select } from 'primeng/select';
import { FloatLabel } from 'primeng/floatlabel';
import { AccordionModule } from 'primeng/accordion';
import { TagModule } from 'primeng/tag';
import { CommonModule } from '@angular/common';
import { Toast } from "primeng/toast";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { Tooltip } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';


type FilterOption = {
  label: string;
  value: string;
  color: string;
};

@Component({
  selector: 'app-conclude-sale',
  imports: [CardBaseComponent, 
    ButtonModule, 
    NgClass, 
    Divider, 
    Select, 
    FloatLabel, 
    AccordionModule, 
    TagModule, 
    CommonModule, 
    Toast, 
    TableModule, 
    Textarea, 
    Tooltip, 
    FormsModule,
    ToastModule],
    providers: [MessageService],
    templateUrl: './sales-panel.component.html',
    styleUrl: './sales-panel.component.scss'
})
export class ConcludeSaleComponent {
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  isEditing = false;
  saving = false;
  observation='';
  contract = { situationDescription: 'INSTALACAO' as const };


  
   // 3. Propriedades do filtro, agora DENTRO da classe
  filterOptions: FilterOption[] = [
  { label: 'Completada', value: 'COMPLETADA', color: 'success' },
  { label: 'Aprovada', value: 'APROVADA', color: 'warn' },
  { label: 'Em Instalação', value: 'INSTALACAO', color: 'secondary' },
  { label: 'Arquivada', value: 'ARQUIVADA', color: 'info' }
];

  selectedFilter: FilterOption | null = null;
  
  // 4. Adicionado um array para simular os dados originais
  private allContracts: any[] = []; // Preencha com seus dados completos
  filteredContracts: any[] = [];

  // Métodos do componente
  backToSearch(): void {
    this.router.navigate(['search']);
  }

  onFilterChange(): void {
    if (!this.selectedFilter) {
      this.filteredContracts = [...this.allContracts]; // Mostra todos se nada for selecionado
      return;
    }
    const filterValue = this.selectedFilter.value;
    console.log('Filtrando por:', filterValue);
    this.filteredContracts = this.allContracts.filter(contract => contract.status === filterValue);
  }

  async onEditButtonClick(e: MouseEvent): Promise<void> {
    e.stopPropagation();
    if (this.saving) return;

    if (!this.isEditing) {
      this.isEditing = true;
      setTimeout(() => document.getElementById('observacao')?.focus(), 0);
    } else {
      this.saving = true;
      try {
        await new Promise((r) => setTimeout(r, 1000));
        this.isEditing = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Observação salva com sucesso!',
          life: 3000,
        });
      } catch (err) {
        console.error('Erro ao salvar', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível salvar a observação.',
          life: 3000,
        });
      } finally {
        this.saving = false;
      }
    }
  }

  async save(): Promise<void> {
    try {
      this.saving = true;
      await new Promise((r) => setTimeout(r, 500));
      this.isEditing = false;
    } catch (e) {
      console.error('Erro ao salvar', e);
    } finally {
      this.saving = false;
    }
  }
}