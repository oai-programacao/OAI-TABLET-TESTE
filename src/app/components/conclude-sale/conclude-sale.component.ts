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
import { IftaLabel } from "primeng/iftalabel";
import { TableModule } from "primeng/table";
import { Textarea } from "primeng/textarea";
import { Tooltip } from 'primeng/tooltip';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-conclude-sale',
  imports: [CardBaseComponent, ButtonModule, NgClass, Divider, Select, FloatLabel, AccordionModule, TagModule, CommonModule, Toast, IftaLabel, TableModule, Textarea, Tooltip, FormsModule],
  templateUrl: './conclude-sale.component.html',
  styleUrl: './conclude-sale.component.scss'
})
export class ConcludeSaleComponent {
  isEditing = false;
  saving = false;
  observation='';
  private readonly router = inject(Router);


  // Valor fixo para o nosso teste. Isso GARANTE que a classe será aplicada.
  contract = { situationDescription: 'ATIVO' as const };

  backToSearch() {
    this.router.navigate(['search']);
  }

 

  // Mock do formulário
  form = {
    nome: '',
    plano: '',
    observacao: '',
  };

   async onEditButtonClick(e: MouseEvent) {
    // Evita abrir/fechar o accordion ao clicar no botão do header
    e.stopPropagation();

    if (this.saving) return;

    if (!this.isEditing) {
      // Entrar em edição
      this.isEditing = true;
      // Foca no textarea (opcional)
      setTimeout(() => document.getElementById('observacao')?.focus(), 0);
    } else {
      // Salvar
      this.saving = true;

      try{
        await new Promise((r) => setTimeout(r, 1000));

        // await this.salesService.save(this.observation).toPromise();
        this.isEditing = false;
      }catch (err){
        console.error('Erro ao salvar', err);
      }finally{
        this.saving = false; //remover o spinner
      }
    }
  }

  async save() {
    
    try {
        this.saving = true;
      // TODO: chame seu service de persistência aqui
      // await this.salesService.save(this.form).toPromise();
      await new Promise((r) => setTimeout(r, 500)); 

      this.isEditing = false;
    } catch (e) {
      console.error('Erro ao salvar', e);
      // opcional: mostrar toast
    } finally {
      this.saving = false;
    }
  }
}