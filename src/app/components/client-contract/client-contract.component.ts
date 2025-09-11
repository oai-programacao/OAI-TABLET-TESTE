import { CommonModule, PlatformLocation } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { CardBaseComponent } from "../../shared/components/card-base/card-base.component";
import { ButtonModule } from 'primeng/button';
import { Divider } from "primeng/divider";
import { Router } from '@angular/router';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

export interface Contract {
  plan: string;
  namePlan: string;
  price: number;
}

export interface Seller {
  name: string;
}

export interface Plan {
  plan: string;
}
@Component({
  selector: 'app-client-contract',
  imports: [CommonModule, CardBaseComponent, ButtonModule, Divider, DialogModule, SelectModule, FormsModule, ReactiveFormsModule, ToastModule],
  templateUrl: './client-contract.component.html',
  styleUrl: './client-contract.component.scss',
  providers: [MessageService],
})
export class ClientContractComponent implements OnInit {
  form!: FormGroup;
  downgradeDialog: boolean = false;
  upgradeDialog: boolean = false;
  selectedSeller: Seller | undefined;
  selectedPlan: Plan | undefined;

  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);
  private readonly router = inject(Router);


  ngOnInit() {
    this.form = this.fb.group({
      plan: ['', Validators.required],
      seller: ['', Validators.required],
      newqos: ['Limitação Padrão'],
      newsla: ['Pessoa Física'],
    })
  }


  typePlanFromClient: any[] = [{
    plan: '9009 OAI ULTRA CONECTADO'
  }];

  seller: Seller[] = [
    { name: 'Valquíria' },
    { name: 'Jennifer' },
    { name: 'Jefferson' },
  ]

  plan: Plan[] = [
    { plan: '9009 OAI ULTRA CONECTADO' },
    { plan: '4578 OAI ULTRA CONECTADO' },
    { plan: '90059 OAI 100% CONECTADO' },
    { plan: '1367 OAI ULTRA CONECTADO' },
  ]

  contracts: Contract[] = [
    { plan: '9009', namePlan: '250Megas', price: 99.90 },
    { plan: '10050', namePlan: '1GB', price: 249.90 },
    { plan: '10204', namePlan: '500Megas', price: 100.90 },
    { plan: '12103', namePlan: '300Megas', price: 79.90 },
    { plan: '45742', namePlan: '700Megas', price: 149.90 },
    { plan: '32014', namePlan: '100Megas', price: 49.90 },
  ]

  navigateToCreatContract() {
    this.router.navigate(['add-contract'])
  }

  navigateToInfoClient() {
    this.router.navigate(['info'])
  }

  openUpgradeDialog() {
    this.upgradeDialog = true;

  }

  openDowngradeDialog() {
    this.downgradeDialog = true;
  }

  onHide(){
    this.form.reset()
  }
  // Futuramente com os dados
  navigateToAddressTransfer(){
    this.router.navigate(['address-transfer'])  
  }

  submitFormsUpgrade() {
    if (!this.form.valid) {
      this.messageService.add({
        summary: 'Sucesso',
        severity: 'warn',
        detail: 'Erro ao realizar o Upgrade'
      })
    } else {
      this.messageService.add({
        summary: "Sucesso",
        severity: "success",
        detail: "Upgrade realizado com sucesso!",
      })
    }
    console.log(this.form.value);
    this.form.reset()
    this.upgradeDialog = false;

  }
  submitFormsDowngrade() {
    if (!this.form.valid) {
      this.messageService.add({
        summary: 'Sucesso',
        severity: 'warn',
        detail: 'Erro ao realizar o Downgrade'
      })
    } else {
      this.messageService.add({
        summary: "Sucesso",
        severity: "success",
        detail: "Downgrade realizado com sucesso!",
      })
    }
    console.log(this.form.value);
    this.form.reset()
    this.upgradeDialog = false;

  }


}
