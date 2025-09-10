import { Component, ViewChild } from '@angular/core';
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
import { NgxCurrencyDirective } from 'ngx-currency';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';
import { Popover } from 'primeng/popover';

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
    NgxCurrencyDirective,
    DatePickerModule,
    DividerModule,
    Popover,
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
})
export class AddContractComponent {
  @ViewChild('pop') pop!: Popover;

  dateOfExpiration: Date | null = null;
  dateOfAssignment: Date | null = null;
  dateOfStart: Date | null = null;
  dateOfMemberShipExpiration: Date | null = null;

  selectContract: string | null = null;
  typesOfContractOptions = [
    { label: 'Sem Fidelidade', value: 'semFidelidade' },
    { label: 'Com Fidelidade', value: 'comFidelidade' },
  ];

  selectedPlan: string | null = null;
  plans = [
    { label: 'Plano Básico', value: 'basico' },
    { label: 'Plano Intermediário', value: 'intermediario' },
    { label: 'Plano Avançado', value: 'avancado' },
  ];

  selectedInstallment: string | null = null;
  numbersOfInstallments = [
    { label: '1x', value: '1' },
    { label: '2x', value: '2' },
    { label: '3x', value: '3' },
    { label: '4x', value: '4' },
    { label: '5x', value: '5' },
    { label: '6x', value: '6' },
    { label: '7x', value: '7' },
    { label: '8x', value: '8' },
    { label: '9x', value: '9' },
    { label: '10x', value: '10' },
    { label: '11x', value: '11' },
    { label: '12x', value: '12' },
    { label: '13x', value: '13' },
    { label: '14x', value: '14' },
    { label: '15x', value: '15' },
    { label: '16x', value: '16' },
    { label: '17x', value: '17' },
    { label: '18x', value: '18' },
    { label: '19x', value: '19' },
    { label: '20x', value: '20' },
    { label: '21x', value: '21' },
    { label: '22x', value: '22' },
    { label: '23x', value: '23' },
    { label: '24x', value: '24' },
  ];

  images: { [key: number]: string } = {};

  toggle(event: Event) {
    event.stopPropagation();
    if (this.pop.overlayVisible) {
      this.pop.hide();
    } else {
      this.pop.show(event);
    }
  }

  onAddImage(slot: number) {
    const url = prompt('Cole a URL da imagem:'); // exemplo simples
    if (url) {
      this.images[slot] = url;
    }
  }
}
