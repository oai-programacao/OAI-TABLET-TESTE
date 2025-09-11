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
import { DialogModule } from 'primeng/dialog';
import { NgxMaskDirective } from 'ngx-mask';
import { TextareaModule } from 'primeng/textarea';
import { GoogleMapsComponent } from '../../shared/components/google-maps/google-maps.component';

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
    DialogModule,
    NgxMaskDirective,
    TextareaModule,
    GoogleMapsComponent
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
  
  //google maps
  showMapDialog = false;
  center: google.maps.LatLngLiteral = { lat: -23.55052, lng: -46.633308 }; // exemplo SP
  zoom = 15;

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

  selectedResidence: string | null = null;
  typeOfResidenceOptions = [
    { label: 'Urbana', value: 'urbana' },
    { label: 'Rural', value: 'rural' },
  ];

  fullAddress = {
    logradouro: 'Avenida Brasil',
    numero: '1000',
    bairro: 'Centro',
    localidade: 'São Paulo',
  };

  toggle(popover: any, event: Event) {
    if (popover.overlayVisible) {
      popover.hide();
    } else {
      popover.show(event);
    }
  }

  images: (string | null)[] = [null, null, null, null, null];

  previewVisible = false;
  previewImage: string | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const firstEmptyIndex = this.images.findIndex((img) => img === null);
        if (firstEmptyIndex !== -1) {
          this.images[firstEmptyIndex] = reader.result as string;
        }
      };
      reader.readAsDataURL(input.files[0]);
    }
    input.value = '';
  }

  removeImage(index: number) {
    this.images[index] = null;
  }

  viewImage(image: string) {
    this.previewImage = image;
    this.previewVisible = true;
  }
}
