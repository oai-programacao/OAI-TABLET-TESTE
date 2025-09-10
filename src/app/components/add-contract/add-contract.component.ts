import { Component } from '@angular/core';
import { CardBaseComponent } from '../../shared/components/card-base/card-base.component';
import { StepperModule } from 'primeng/stepper';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InputGroupModule } from 'primeng/inputgroup';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { NgxCurrencyDirective } from "ngx-currency";

@Component({
  selector: 'app-add-contract',
  imports: [
    CardBaseComponent,
    StepperModule,
    ButtonModule,
    FormsModule,
    CommonModule,
    InputGroupModule,
    IftaLabelModule,
    InputGroupAddonModule,
    InputTextModule,
    SelectModule,
    NgxCurrencyDirective
],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
})
export class AddContractComponent {

  selectedPlan: string | null = null;

  plans = [
    { label: 'Plano Básico', value: 'basico' },
    { label: 'Plano Intermediário', value: 'intermediario' },
    { label: 'Plano Avançado', value: 'avancado' },
  ];


}
