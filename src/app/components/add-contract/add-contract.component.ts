import { Component, inject, ViewChild } from '@angular/core';
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
import { SignaturePadComponent } from '../../shared/components/signature-pad/signature-pad.component';
import { MessageService } from 'primeng/api';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-contract',
  standalone: true,
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
    GoogleMapsComponent,
    SignaturePadComponent,
  ],
  templateUrl: './add-contract.component.html',
  styleUrl: './add-contract.component.scss',
  providers: [MessageService],
})
export class AddContractComponent {
  @ViewChild('pop') pop!: Popover;

  private readonly router = inject(Router);



  constructor(public messageService: MessageService) {}

  dateofExpirationCicle: Date | null = null;
  dateOfAssignment: Date | null = null;
  dateOfStart: Date | null = null;
  dateOfMemberShipExpiration: Date | null = null;

  formData = {
    signaturePad: '',
  };

  //google maps
  showMapDialog = false;
  center: google.maps.LatLngLiteral = { lat: -23.55052, lng: -46.633308 }; // exemplo SP
  zoom = 15;

  selectContract: string | null = null;
  typesOfContractOptions = [
    { label: 'Sem Fidelidade', value: '' },
    { label: 'Com Fidelidade', value: '12' },
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

  selectDateOfExpirationCicle: string | null = null;
  typesOfDateExpirationCicle = [
    { dia: '1', vencimento: '1', descricao: '01 a 31 / 01 ', value: '1' },
    { dia: '2', vencimento: '2', descricao: '02 a 01 / 02', value: '2' },
    { dia: '3', vencimento: '3', descricao: '03 a 02 / 03', value: '3' },
    { dia: '4', vencimento: '4', descricao: '04 a 03 / 04', value: '4' },
    { dia: '5', vencimento: '5', descricao: '05 a 04 / 05', value: '5' },
    { dia: '6', vencimento: '6', descricao: '06 a 05 / 06', value: '6' },
    { dia: '7', vencimento: '7', descricao: '07 a 06 / 07', value: '7' },
    { dia: '8', vencimento: '8', descricao: '08 a 07 / 08', value: '8' },
    { dia: '9', vencimento: '9', descricao: '09 a 08 / 09', value: '9' },
    { dia: '10', vencimento: '10', descricao: '10 a 09 / 10', value: '10' },
    { dia: '11', vencimento: '11', descricao: '11 a 10 / 11', value: '11' },
    { dia: '12', vencimento: '12', descricao: '12 a 11 / 12', value: '12' },
    { dia: '12', vencimento: '13', descricao: '12 a 11 / 13', value: '13' },
    { dia: '14', vencimento: '14', descricao: '14 a 13 / 14', value: '14' },
    { dia: '15', vencimento: '15', descricao: '15 a 14 / 15', value: '15' },
    { dia: '16', vencimento: '16', descricao: '16 a 15 / 16', value: '16' },
    { dia: '17', vencimento: '17', descricao: '17 a 16 / 17', value: '17' },
    { dia: '18', vencimento: '18', descricao: '18 a 17 / 18', value: '18' },
    { dia: '19', vencimento: '19', descricao: '19 a 18 / 19', value: '19' },
    { dia: '20', vencimento: '20', descricao: '20 a 19 / 20', value: '20' },
    { dia: '21', vencimento: '21', descricao: '21 a 20 / 21', value: '21' },
    { dia: '22', vencimento: '22', descricao: '22 a 21 / 22', value: '22' },
    { dia: '23', vencimento: '23', descricao: '23 a 22 / 23', value: '23' },
    { dia: '24', vencimento: '24', descricao: '24 a 23 / 24', value: '24' },
    { dia: '25', vencimento: '25', descricao: '25 a 24 / 25', value: '25' },
    { dia: '26', vencimento: '26', descricao: '26 a 25 / 26', value: '26' },
    { dia: '27', vencimento: '27', descricao: '27 a 26 / 27', value: '27' },
    { dia: '28', vencimento: '28', descricao: '28 a 27 / 28', value: '28' },
    { dia: '28', vencimento: '29', descricao: '28 a 27 / 29', value: '29' },
    { dia: '28', vencimento: '30', descricao: '28 a 27 / 30', value: '30' },
    { dia: '28', vencimento: '31', descricao: '28 a 27 / 31', value: '31' },
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

  onSignatureData(signatureData: string): void {
    this.formData.signaturePad = signatureData;

    // se quiser mostrar mensagem
    this.messageService.add({
      severity: 'success',
      summary: 'Assinatura Capturada',
      detail: 'A assinatura foi capturada com sucesso.',
    });
  }

  backToSearch(){
    this.router.navigate(['search'])
  }

}
